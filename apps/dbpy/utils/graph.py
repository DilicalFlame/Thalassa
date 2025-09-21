import duckdb
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from io import BytesIO
import base64
from datetime import datetime

# con = duckdb.connect('../LOCAL/Resources/argo.db', read_only=True)
# query = """
#         SELECT * from oceans;
#         """
# df = con.execute(query ).fetchdf()
# print(df)
class OceanGraphGenerator:
    def __init__(self, db_path: str = '../LOCAL/Resources/argo.db'):
        self.db_path = db_path
        self.connection = None

    def get_connection(self):
        if self.connection is None:
            self.connection = duckdb.connect(database=self.db_path, read_only=True)
        return self.connection

    def close_connection(self):
        if self.connection:
            self.connection.close()
            self.connection = None

    def get_all_floater_ids(self) -> List[str]:
        con = self.get_connection()
        query = """
                SELECT DISTINCT platform_id
                FROM argo2023_slim
                WHERE platform_id IS NOT NULL
                ORDER BY platform_id \
                """
        result = con.execute(query).fetchall()
        return [str(row[0]) for row in result]

    def get_floater_data(self, platform_id: str) -> pd.DataFrame:
        con = self.get_connection()
        query = f"""
        SELECT * 
        FROM argo2023_slim 
        WHERE platform_id = {platform_id}
        ORDER BY date
        """
        return con.execute(query).fetchdf()

    def get_floater_latest_position(self, platform_id: str) -> Dict:
        con = self.get_connection()
        query = f"""
        SELECT platform_id, lat, lon, date
        FROM argo2023_slim 
        WHERE platform_id = {platform_id}
        ORDER BY date DESC
        LIMIT 1
        """
        result = con.execute(query).fetchdf()
        if not result.empty:
            return result.iloc[0].to_dict()
        return {}

    def get_all_floater_positions(self) -> pd.DataFrame:
        con = self.get_connection()
        query = """
                SELECT platform_id, lat, lon, MAX(date) as last_measurement
                FROM argo2023_slim
                WHERE lat IS NOT NULL AND lon IS NOT NULL
                GROUP BY platform_id, lat, lon
                ORDER BY platform_id \
                """
        return con.execute(query).fetchdf()

    def plot_temperature_profile(self, platform_id: str) -> str:
        con = self.get_connection()
        query = f"""
        SELECT depth_m, temp_c, date
        FROM argo2023_slim 
        WHERE platform_id = {platform_id} 
        AND depth_m IS NOT NULL 
        AND temp_c IS NOT NULL
        ORDER BY date, depth_m
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        plt.figure(figsize=(10, 8))
        plt.plot(df['temp_c'], df['depth_m'], 'o-', markersize=3, alpha=0.7,color='blue')
        plt.gca().invert_yaxis()
        plt.xlabel('Temperature (°C)')
        plt.ylabel('Depth (m)')
        plt.title(f'Temperature Profile - Floater {platform_id}')
        plt.grid(True, alpha=0.3)

        return self._plot_to_base64()

    def plot_salinity_profile(self, platform_id: str) -> str:
        con = self.get_connection()
        query = f"""
        SELECT depth_m, sal_psu, date
        FROM argo2023_slim 
        WHERE platform_id = {platform_id} 
        AND depth_m IS NOT NULL 
        AND sal_psu IS NOT NULL
        ORDER BY date, depth_m
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        plt.figure(figsize=(10, 8))
        plt.plot(df['sal_psu'], df['depth_m'], 'o-', color='green', markersize=3, alpha=0.7)
        plt.gca().invert_yaxis()
        plt.xlabel('Salinity (PSU)')
        plt.ylabel('Depth (m)')
        plt.title(f'Salinity Profile - Floater {platform_id}')
        plt.grid(True, alpha=0.3)

        return self._plot_to_base64()

    def plot_temperature_timeseries(self, platform_id: str) -> str:
        con = self.get_connection()
        query = f"""
        SELECT date, temp_c, depth_m
        FROM argo2023_slim 
        WHERE platform_id = {platform_id} 
        AND temp_c IS NOT NULL
        ORDER BY date
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        plt.figure(figsize=(12, 6))
        df['depth_category'] = pd.cut(df['depth_m'],
                                      bins=[0, 50, 200, 500, 1000, 2000],
                                      labels=['0-50m', '50-200m', '200-500m', '500-1000m', '1000-2000m'])

        for depth_cat in df['depth_category'].unique():
            subset = df[df['depth_category'] == depth_cat]
            plt.plot(subset['date'], subset['temp_c'], 'o-', label=str(depth_cat), markersize=2, alpha=0.7,color='red')

        plt.xlabel('Date')
        plt.ylabel('Temperature (°C)')
        plt.title(f'Temperature Time Series - Floater {platform_id}')
        plt.legend()
        plt.xticks(rotation=45)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        return self._plot_to_base64()

    def plot_salinity_timeseries(self, platform_id: str) -> str:
        """Create salinity timeseries plot for a floater"""
        con = self.get_connection()
        query = f"""
        SELECT date, sal_psu, depth_m
        FROM argo2023_slim 
        WHERE platform_id = {platform_id} 
        AND sal_psu IS NOT NULL
        ORDER BY date
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        plt.figure(figsize=(12, 6))

        df['depth_category'] = pd.cut(df['depth_m'],
                                      bins=[0, 50, 200, 500, 1000, 2000],
                                      labels=['0-50m', '50-200m', '200-500m', '500-1000m', '1000-2000m'])

        for depth_cat in df['depth_category'].unique():
            subset = df[df['depth_category'] == depth_cat]
            plt.plot(subset['date'], subset['sal_psu'], 'o-', label=str(depth_cat), markersize=2, alpha=0.7,color='grey')

        plt.xlabel('Date')
        plt.ylabel('Salinity (PSU)')
        plt.title(f'Salinity Time Series - Floater {platform_id}')
        plt.legend()
        plt.xticks(rotation=45)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        return self._plot_to_base64()

    def plot_temperature_salinity(self, platform_id: str) -> str:
        con = self.get_connection()
        query = f"""
        SELECT temp_c, sal_psu, depth_m
        FROM argo2023_slim 
        WHERE platform_id = {platform_id} 
        AND temp_c IS NOT NULL 
        AND sal_psu IS NOT NULL
        ORDER BY depth_m
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        plt.figure(figsize=(10, 8))
        scatter = plt.scatter(df['sal_psu'], df['temp_c'], c=df['depth_m'],
                              cmap='viridis_r', alpha=0.7, s=30)
        plt.colorbar(scatter, label='Depth (m)')
        plt.xlabel('Salinity (PSU)')
        plt.ylabel('Temperature (°C)')
        plt.title(f'T-S Diagram - Floater {platform_id}')
        plt.grid(True, alpha=0.3)
        return self._plot_to_base64()

    def plot_floater_trajectory(self, platform_id: str) -> str:
        con = self.get_connection()
        query = f"""
        SELECT lon, lat, date
        FROM argo2023_slim 
        WHERE platform_id = {platform_id} 
        AND lat IS NOT NULL 
        AND lon IS NOT NULL
        ORDER BY date
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        plt.figure(figsize=(12, 8))
        plt.plot(df['lon'], df['lat'], 'o-', markersize=3, alpha=0.7, linewidth=1)
        plt.scatter(df['lon'].iloc[0], df['lat'].iloc[0], color='green', s=100, label='Start', zorder=5)
        plt.scatter(df['lon'].iloc[-1], df['lat'].iloc[-1], color='red', s=100, label='End', zorder=5)

        plt.xlabel('Longitude')
        plt.ylabel('Latitude')
        plt.title(f'Trajectory - Floater {platform_id}')
        plt.legend()
        plt.grid(True, alpha=0.3)

        return self._plot_to_base64()

    def get_all_graphs_for_floater(self, platform_id: str) -> Dict[str, str]:
        """Generate all available graphs for a specific floater"""
        graphs = {}

        graphs['temperature_profile'] = self.plot_temperature_profile(platform_id)
        graphs['salinity_profile'] = self.plot_salinity_profile(platform_id)
        graphs['temperature_timeseries'] = self.plot_temperature_timeseries(platform_id)
        graphs['salinity_timeseries'] = self.plot_salinity_timeseries(platform_id)
        graphs['ts_diagram'] = self.plot_temperature_salinity(platform_id)
        graphs['trajectory'] = self.plot_floater_trajectory(platform_id)

        # Remove None values (graphs that couldn't be created)
        return {k: v for k, v in graphs.items() if v is not None}

    def _plot_to_base64(self) -> str:
        """Convert matplotlib plot to base64 string for web display"""
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
        plt.close()
        buf.seek(0)
        image_base64 = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()
        return image_base64

# Utility functions for easy usage
def create_floater_graphs(platform_id: str, db_path: str = '../LOCAL/Resources/argo.db') -> Dict[str, str]:
    """Convenience function to create all graphs for a floater"""
    generator = OceanGraphGenerator(db_path)
    try:
        return generator.get_all_graphs_for_floater(platform_id)
    finally:
        generator.close_connection()

def get_available_floater_ids(db_path: str = '../LOCAL/Resources/argo.db') -> List[str]:
    """Get list of all available floater IDs"""
    generator = OceanGraphGenerator(db_path)
    try:
        return generator.get_all_floater_ids()
    finally:
        generator.close_connection()

# Example usage
if __name__ == "__main__":
    # Test the functions
    generator = OceanGraphGenerator()

    # Get all available floater IDs
    floater_ids = generator.get_all_floater_ids()
    print(f"Available floater IDs: {floater_ids[:5]}...")  # Show first 5

    if floater_ids:
        # Test with first floater
        test_floater = floater_ids[0]
        print(f"\nGenerating graphs for floater: {test_floater}")

        # Get all graphs
        graphs = generator.get_all_graphs_for_floater(test_floater)
        print(f"Generated {len(graphs)} graphs")

        # Show available graph types
        print("Available graphs:", list(graphs.keys()))


    generator.close_connection()
