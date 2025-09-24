from typing import Optional, List
import duckdb
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# --- 1. INITIALIZATION ---
app = FastAPI(
    title="Thalassa API",
    description="An API for exploring global ARGO float data from a DuckDB database.",
    version="0.2.0", # Version bump for the optimization!
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    # Connect in read-only mode for the API server
    con = duckdb.connect('./LOCAL/Resources/argo.db', read_only=True)
    print("Successfully connected to DuckDB database.")
except Exception as e:
    print(f"Error connecting to DuckDB: {e}")
    con = None


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
    if not con:
        raise HTTPException(status_code=503, detail="Database connection not available.")
    year = _validate_year(year)
    table = _distinct_positions_table(year)
    query = f"""
            SELECT date, lat, lon
            FROM {table}
            WHERE platform_id = ?
            ORDER BY date;
            """
    try:
        df = con.execute(query, [platform_id]).fetchdf()
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Float with ID {platform_id} not found for year {year}.")
        return df.to_dict(orient='records')
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/float/{platform_id}/profile")
def get_float_latest_profile(platform_id: int, year: int = Query(2023, description="Year for which to return latest profile")):
    if not con:
        raise HTTPException(status_code=503, detail="Database connection not available.")
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
    try:
        df = con.execute(query, [platform_id, platform_id]).fetchdf()
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Profile data for float ID {platform_id} not found for year {year}.")
        return df.to_dict(orient='records')
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/float/{platform_id}/dossier")
def get_float_dossier(platform_id: int, year: int = Query(2023, description="Year for which to return dossier")):
    if not con:
        raise HTTPException(status_code=503, detail="Database connection not available.")
    year = _validate_year(year)
    argotable = _argo_table(year)
    query = f"""
            SELECT date, depth_m, temp_c, sal_psu
            FROM {argotable}
            WHERE platform_id = ?
            ORDER BY date, depth_m;
            """
    try:
        df = con.execute(query, [platform_id]).fetchdf()
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Dossier data for float ID {platform_id} not found for year {year}.")
        df['date'] = df['date'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
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
    if not con:
        raise HTTPException(status_code=503, detail="Database connection not available.")
    year = _validate_year(year)
    latest_table = _latest_positions_table(year)
    query = f"""
            SELECT platform_id, lat, lon, date
            FROM {latest_table}
            WHERE lat BETWEEN ? AND ?
              AND lon BETWEEN ? AND ?
            LIMIT ?;
            """
    try:
        df = con.execute(query, [min_lat, max_lat, min_lon, max_lon, limit]).fetchdf()
        return df.to_dict(orient='records')
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/api/float/all/platform_id")
def get_all_platform_ids(year: int = Query(2023, description="Year for which to list platform IDs")):
    if not con:
        raise HTTPException(status_code=503, detail="Database connection not available.")
    year = _validate_year(year)
    latest_table = _latest_positions_table(year)
    query = f"SELECT platform_id FROM {latest_table} ORDER BY platform_id;"
    try:
        df = con.execute(query).fetchdf()
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
        limit: Optional[int] = Query(20000, description="Limit total number of position records returned")
):
    """Return float positions across a date range spanning one or multiple years.

    This unions the distinct position tables for each intersecting year and filters by date & bbox.
    Returned rows include platform_id, lat, lon, date.
    """
    import datetime as _dt
    if not con:
        raise HTTPException(status_code=503, detail="Database connection not available.")
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
    try:
        df = con.execute(final_query, params).fetchdf()
        return {"count": len(df), "start_date": start_date, "end_date": end_date, "positions": df.to_dict(orient='records')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

