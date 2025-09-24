from typing import Optional, List
import duckdb
import re
import contextlib
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# --- 1. INITIALIZATION ---
app = FastAPI(
    title="Thalassa API",
    description="An API for exploring global ARGO float data from a DuckDB database.",
    version="0.2.0", # Version bump for the optimization!
)

app.add_middleware(
    CORSMiddleware,
    # Allow any localhost / 127.0.0.1 port (dev flexibility)
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

# Additional safeguard middleware: ensure CORS headers are added even if an earlier
# exception short-circuits (some edge cases with certain ASGI error paths can omit them)
ALLOWED_ORIGIN_REGEX = re.compile(r"https?://(localhost|127\.0\.0\.1)(:\d+)?")

@app.middleware("http")
async def ensure_cors_headers(request: Request, call_next):
    origin = request.headers.get("origin")
    try:
        response = await call_next(request)
    except Exception as e:  # pragma: no cover (defensive)
        # Wrap unexpected errors in JSON for consistency
        response = JSONResponse(status_code=500, content={"detail": f"Internal error: {e}"})
    if origin and ALLOWED_ORIGIN_REGEX.match(origin):
        # Only set if not already present to avoid overwriting primary middleware decisions
        response.headers.setdefault("Access-Control-Allow-Origin", origin)
        response.headers.setdefault("Vary", "Origin")
        if request.method == "OPTIONS":
            response.headers.setdefault("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
            response.headers.setdefault("Access-Control-Allow-Headers", request.headers.get("access-control-request-headers", "*"))
    return response

@app.get("/api/debug/cors")
def debug_cors(request: Request):
    origin = request.headers.get("origin")
    return {"received_origin": origin, "message": "CORS debug ok"}

DB_PATH = './LOCAL/Resources/argo.db'

try:
    # Maintain a lightweight initial connection just to validate file (will not be reused for queries)
    _init_con = duckdb.connect(DB_PATH, read_only=True)
    _init_con.close()
    print("Successfully validated DuckDB database path.")
except Exception as e:
    print(f"Error validating DuckDB: {e}")
    _init_con = None

@contextlib.contextmanager
def get_con():
    """Context manager returning a fresh read-only DuckDB connection per request.
    Using a new connection avoids cross-request state/race issues that can (rarely)
    surface as intermittent empty result sets when reusing a single connection.
    """
    try:
        c = duckdb.connect(DB_PATH, read_only=True)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")
    try:
        yield c
    finally:
        try:
            c.close()
        except Exception:
            pass


# --- 2. API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the Thalassa Ocean Intelligence API!"}


# ... (get_float_path and get_float_latest_profile endpoints remain the same) ...
ALLOWED_YEARS = {2022, 2023, 2024}

def _validate_year(year: int) -> int:
    if year not in ALLOWED_YEARS:
        raise HTTPException(status_code=400, detail=f"Year {year} not available. Valid years: {sorted(ALLOWED_YEARS)}")
    return year

def _year_table(base: str, year: int) -> str:
    _validate_year(year)
    return f"main.{base}{year}"

def _latest_positions_table(year: int) -> str:
    return _year_table("latest_float_positions_", year)

def _distinct_positions_table(year: int) -> str:
    return _year_table("distinct_float_positions_", year)

def _argo_table(year: int) -> str:
    return _year_table("argo", year)

@app.get("/api/float/{platform_id}/path")
def get_float_path(platform_id: int, year: int = Query(2023, description="Year for which to return float path")):
    year = _validate_year(year)
    table = _distinct_positions_table(year)
    query = f"""
            SELECT date, lat, lon
            FROM {table}
            WHERE platform_id = ?
            ORDER BY date;
            """
    with get_con() as c:
        try:
            df = c.execute(query, [platform_id]).fetchdf()
            if df.empty:
                raise HTTPException(status_code=404, detail=f"Float with ID {platform_id} not found for year {year}.")
            return df.to_dict(orient='records')
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/float/{platform_id}/profile")
def get_float_latest_profile(platform_id: int, year: int = Query(2023, description="Year for which to return latest profile")):
    year = _validate_year(year)
    argotable = _argo_table(year)
    query = f"""
            WITH LatestDate AS (
                SELECT MAX(date) AS max_date
                FROM {argotable}
                WHERE platform_id = ?
            )
            SELECT depth_m, temp_c, sal_psu
            FROM {argotable}
            WHERE platform_id = ? AND date = (SELECT max_date FROM LatestDate)
            ORDER BY depth_m;
            """
    with get_con() as c:
        try:
            df = c.execute(query, [platform_id, platform_id]).fetchdf()
            if df.empty:
                raise HTTPException(status_code=404, detail=f"Profile data for float ID {platform_id} not found for year {year}.")
            return df.to_dict(orient='records')
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/float/{platform_id}/dossier")
def get_float_dossier(platform_id: int, year: int = Query(2023, description="Year for which to return dossier")):
    year = _validate_year(year)
    argotable = _argo_table(year)
    query = f"""
            SELECT date, depth_m, temp_c, sal_psu
            FROM {argotable}
            WHERE platform_id = ?
            ORDER BY date, depth_m;
            """
    with get_con() as c:
        try:
            df = c.execute(query, [platform_id]).fetchdf()
            rowcount = len(df.index)
            print(f"[dossier] platform_id={platform_id} year={year} rows={rowcount}")
            if rowcount == 0:
                raise HTTPException(status_code=404, detail=f"Dossier data for float ID {platform_id} not found for year {year}.")
            if 'date' in df.columns:
                try:
                    df['date'] = df['date'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
                except Exception as _e:
                    print(f"[dossier] date formatting issue platform_id={platform_id} year={year}: {_e}")
            return df.to_dict(orient='records')
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# floats in a bounding box
@app.get("/api/floats_in_box")
def get_floats_in_box(
        min_lat: float = Query(..., description="Minimum latitude"),
        max_lat: float = Query(..., description="Maximum latitude"),
        min_lon: float = Query(..., description="Minimum longitude"),
        max_lon: float = Query(..., description="Maximum longitude"),
        year: int = Query(2023, description="Year for which to return latest float positions"),
        limit: Optional[int] = Query(5000, description="Limit the number of returned floats")
):
    """Return latest position for each float for a given year within bounding box."""
    year = _validate_year(year)
    latest_table = _latest_positions_table(year)
    query = f"""
            SELECT platform_id, lat, lon, date
            FROM {latest_table}
            WHERE lat BETWEEN ? AND ?
              AND lon BETWEEN ? AND ?
            LIMIT ?;
            """
    with get_con() as c:
        try:
            df = c.execute(query, [min_lat, max_lat, min_lon, max_lon, limit]).fetchdf()
            return df.to_dict(orient='records')
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/api/float/all/platform_id")
def get_all_platform_ids(year: int = Query(2023, description="Year for which to list platform IDs")):
    year = _validate_year(year)
    latest_table = _latest_positions_table(year)
    query = f"SELECT platform_id FROM {latest_table} ORDER BY platform_id;"
    with get_con() as c:
        try:
            df = c.execute(query).fetchdf()
            id_list = [int(pid) for pid in df['platform_id'].tolist()]
            return {"platform_ids": id_list, "year": year}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/floats_in_box/range")
def get_floats_in_box_range(
        min_lat: float = Query(..., description="Minimum latitude"),
        max_lat: float = Query(..., description="Maximum latitude"),
        min_lon: float = Query(..., description="Minimum longitude"),
        max_lon: float = Query(..., description="Maximum longitude"),
        start_date: str = Query(..., description="Start ISO date (YYYY-MM-DD)"),
        end_date: str = Query(..., description="End ISO date (YYYY-MM-DD)"),
        limit: Optional[int] = Query(20000000, description="Limit total number of position records returned")
):
    """Return float positions across a date range spanning one or multiple years.

    This unions the distinct position tables for each intersecting year and filters by date & bbox.
    Returned rows include platform_id, lat, lon, date.
    """
    import datetime as _dt
    try:
        sd = _dt.datetime.fromisoformat(start_date)
        ed = _dt.datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    if ed < sd:
        raise HTTPException(status_code=400, detail="end_date must be >= start_date")
    years: List[int] = list({d.year for d in (sd, ed)} | set(range(sd.year, ed.year + 1)))
    for y in years:
        _validate_year(y)
    # Build UNION ALL query across years
    selects = []
    params: List = []
    for y in sorted(years):
        table = _distinct_positions_table(y)
        selects.append(f"SELECT platform_id, lat, lon, date FROM {table} ")
    union_query = " UNION ALL ".join(selects)
    final_query = f"""
        WITH unioned AS (
            {union_query}
        )
        SELECT platform_id, lat, lon, date
        FROM unioned
        WHERE lat BETWEEN ? AND ?
          AND lon BETWEEN ? AND ?
          AND date BETWEEN ? AND ?
        ORDER BY date
        LIMIT ?;
    """
    params.extend([min_lat, max_lat, min_lon, max_lon, sd, ed, limit])
    with get_con() as c:
        try:
            df = c.execute(final_query, params).fetchdf()
            return {"count": len(df), "start_date": start_date, "end_date": end_date, "positions": df.to_dict(orient='records')}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/float/{platform_id}/dossier_range")
def get_float_dossier_range(platform_id: int,
                            start_date: str = Query(..., description="Start ISO date (YYYY-MM-DD)"),
                            end_date: str = Query(..., description="End ISO date (YYYY-MM-DD)")):
    """Return all profile measurements for a float across a date range spanning multiple years."""
    import datetime as _dt
    try:
        sd = _dt.datetime.fromisoformat(start_date)
        ed = _dt.datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    if ed < sd:
        raise HTTPException(status_code=400, detail="end_date must be >= start_date")
    years = list(range(sd.year, ed.year + 1))
    for y in years:
        _validate_year(y)
    selects = []
    for y in years:
        argotable = _argo_table(y)
        selects.append(f"SELECT date, depth_m, temp_c, sal_psu FROM {argotable} WHERE platform_id = ?")
    union_query = " UNION ALL ".join(selects)
    final_query = f"""
        WITH measurements AS (
            {union_query}
        )
        SELECT date, depth_m, temp_c, sal_psu
        FROM measurements
        WHERE date BETWEEN ? AND ?
        ORDER BY date, depth_m
    """
    params = [platform_id] * len(selects) + [sd, ed]
    with get_con() as c:
        try:
            df = c.execute(final_query, params).fetchdf()
            if df.empty:
                raise HTTPException(status_code=404, detail=f"No dossier data for float {platform_id} in range")
            df['date'] = df['date'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
            return {"platform_id": platform_id, "start_date": start_date, "end_date": end_date, "count": len(df), "profiles": df.to_dict(orient='records')}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/float/{platform_id}/path_range")
def get_float_path_range(platform_id: int,
                         start_date: str = Query(..., description="Start ISO date (YYYY-MM-DD)"),
                         end_date: str = Query(..., description="End ISO date (YYYY-MM-DD)")):
    """Return a float's trajectory (distinct positions) across a date range spanning multiple years."""
    import datetime as _dt
    try:
        sd = _dt.datetime.fromisoformat(start_date)
        ed = _dt.datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    if ed < sd:
        raise HTTPException(status_code=400, detail="end_date must be >= start_date")
    years = list(range(sd.year, ed.year + 1))
    for y in years:
        _validate_year(y)
    selects = []
    for y in years:
        table = _distinct_positions_table(y)
        selects.append(f"SELECT date, lat, lon FROM {table} WHERE platform_id = ?")
    union_query = " UNION ALL ".join(selects)
    final_query = f"""
        WITH paths AS (
            {union_query}
        )
        SELECT date, lat, lon
        FROM paths
        WHERE date BETWEEN ? AND ?
        ORDER BY date
    """
    params = [platform_id] * len(selects) + [sd, ed]
    with get_con() as c:
        try:
            df = c.execute(final_query, params).fetchdf()
            if df.empty:
                raise HTTPException(status_code=404, detail=f"No path data for float {platform_id} in range")
            df['date'] = df['date'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
            return df.to_dict(orient='records')
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

