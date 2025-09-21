from typing import Optional
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
    con = duckdb.connect('../../LOCAL/Resources/argo.db', read_only=True)
    print("Successfully connected to DuckDB database.")
except Exception as e:
    print(f"Error connecting to DuckDB: {e}")
    con = None


# --- 2. API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the Thalassa Ocean Intelligence API!"}


# ... (get_float_path and get_float_latest_profile endpoints remain the same) ...
@app.get("/api/float/{platform_id}/path")
def get_float_path(platform_id: int):
    if not con:
        raise HTTPException(status_code=503, detail="Database connection not available.")
    # NOTE: The original query returned the whole path, I've restored that functionality.
    # The `LIMIT 1` was likely for testing.
    query = """
            SELECT date, lat, lon
            FROM main.distinct_float_positions
            WHERE platform_id = ?
            ORDER BY date;
            """
    try:
        df = con.execute(query, [platform_id]).fetchdf()
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Float with ID {platform_id} not found.")
        return df.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/float/{platform_id}/profile")
def get_float_latest_profile(platform_id: int):
    if not con:
        raise HTTPException(status_code=503, detail="Database connection not available.")
    query = """
            WITH LatestDate AS (
                SELECT MAX(date) AS max_date
                FROM main.argo2023
                WHERE platform_id = ?
            )
            SELECT depth_m, temp_c, sal_psu
            FROM main.argo2023
            WHERE platform_id = ? AND date = (SELECT max_date FROM LatestDate)
            ORDER BY depth_m;
            """
    try:
        df = con.execute(query, [platform_id, platform_id]).fetchdf()
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Profile data for float ID {platform_id} not found.")
        return df.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/float/{platform_id}/dossier")
def get_float_dossier(platform_id: int):
    if not con:
        raise HTTPException(status_code=503, detail="Database connection not available.")
    query = """
            SELECT date, depth_m, temp_c, sal_psu
            FROM main.argo2023
            WHERE platform_id = ?
            ORDER BY date, depth_m;
            """
    try:
        df = con.execute(query, [platform_id]).fetchdf()
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Dossier data for float ID {platform_id} not found.")
        df['date'] = df['date'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
        return df.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# floats in a bounding box
@app.get("/api/floats_in_box")
def get_floats_in_box(
        min_lat: float = Query(..., description="Minimum latitude"),
        max_lat: float = Query(..., description="Maximum latitude"),
        min_lon: float = Query(..., description="Minimum longitude"),
        max_lon: float = Query(..., description="Maximum longitude"),
        limit: Optional[int] = Query(5000, description="Limit the number of returned floats")
):
    """
    Finds the most recent position of all unique floats within a geographic
    bounding box by querying a pre-aggregated summary table. THIS IS FAST.
    """
    if not con:
        raise HTTPException(status_code=503, detail="Database connection not available.")

    # This query is now dead simple. It just filters the tiny summary table.
    query = """
            SELECT platform_id, lat, lon, date
            FROM main.latest_float_positions
            WHERE lat BETWEEN ? AND ?
              AND lon BETWEEN ? AND ?
                LIMIT ?;
            """
    try:
        df = con.execute(query, [min_lat, max_lat, min_lon, max_lon, limit]).fetchdf()
        return df.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/api/float/all/platform_id")
def get_all_platform_ids():
    if not con:
        raise HTTPException(status_code=503, detail="Database connection not available.")
    query = "SELECT platform_id FROM main.latest_float_positions ORDER BY platform_id;"
    try:
        df = con.execute(query).fetchdf()
        id_list = [int(pid) for pid in df['platform_id'].tolist()]
        return {"platform_ids": id_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

