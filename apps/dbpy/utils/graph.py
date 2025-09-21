import base64
from io import BytesIO
from typing import List, Dict

import duckdb
import matplotlib.pyplot as plt


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

    def plot_3d_temperature_profile(self, platform_id: str) -> str:
        """Create 3D temperature profile with time as third dimension"""
        con = self.get_connection()
        query = f"""
        SELECT depth_m, temp_c, date
        FROM argo2023_slim 
        WHERE platform_id = '{platform_id}' 
        AND depth_m IS NOT NULL 
        AND temp_c IS NOT NULL
        ORDER BY date, depth_m
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        # Convert date to numeric for 3D plotting
        df['date_numeric'] = (df['date'] - df['date'].min()).dt.total_seconds() / 86400  # Days since first measurement

        fig = plt.figure(figsize=(14, 10))
        ax = fig.add_subplot(111, projection='3d')

        # Create scatter plot
        scatter = ax.scatter(
            df['temp_c'], df['depth_m'], df['date_numeric'],
            c=df['depth_m'], cmap='viridis_r', alpha=0.7, s=20
        )

        ax.set_xlabel('Temperature (°C)', labelpad=15)
        ax.set_ylabel('Depth (m)', labelpad=15)
        ax.set_zlabel('Time (days since first measurement)', labelpad=15)
        ax.set_title(f'3D Temperature Profile - Floater {platform_id}', pad=20)

        # Invert depth axis
        ax.invert_yaxis()

        # Add colorbar
        cbar = fig.colorbar(scatter, ax=ax, pad=0.1)
        cbar.set_label('Depth (m)')

        # Adjust viewing angle
        ax.view_init(elev=20, azim=45)
        plt.show()
        return self._plot_to_base64()

    def plot_3d_salinity_profile(self, platform_id: str) -> str:
        """Create 3D salinity profile with time as third dimension"""
        con = self.get_connection()
        query = f"""
        SELECT depth_m, sal_psu, date
        FROM argo2023_slim 
        WHERE platform_id = '{platform_id}' 
        AND depth_m IS NOT NULL 
        AND sal_psu IS NOT NULL
        ORDER BY date, depth_m
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        # Convert date to numeric for 3D plotting
        df['date_numeric'] = (df['date'] - df['date'].min()).dt.total_seconds() / 86400

        fig = plt.figure(figsize=(14, 10))
        ax = fig.add_subplot(111, projection='3d')

        scatter = ax.scatter(
            df['sal_psu'], df['depth_m'], df['date_numeric'],
            c=df['depth_m'], cmap='plasma_r', alpha=0.7, s=20
        )

        ax.set_xlabel('Salinity (PSU)', labelpad=15)
        ax.set_ylabel('Depth (m)', labelpad=15)
        ax.set_zlabel('Time (days since first measurement)', labelpad=15)
        ax.set_title(f'3D Salinity Profile - Floater {platform_id}', pad=20)

        ax.invert_yaxis()

        cbar = fig.colorbar(scatter, ax=ax, pad=0.1)
        cbar.set_label('Depth (m)')

        ax.view_init(elev=20, azim=45)
        plt.show()

        return self._plot_to_base64()

    def plot_3d_temperature_timeseries(self, platform_id: str) -> str:
        """Create 3D temperature timeseries with depth as third dimension"""
        con = self.get_connection()
        query = f"""
        SELECT date, temp_c, depth_m
        FROM argo2023_slim 
        WHERE platform_id = '{platform_id}' 
        AND temp_c IS NOT NULL
        ORDER BY date, depth_m
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        # Convert date to numeric
        df['date_numeric'] = (df['date'] - df['date'].min()).dt.total_seconds() / 86400

        fig = plt.figure(figsize=(14, 10))
        ax = fig.add_subplot(111, projection='3d')

        scatter = ax.scatter(
            df['date_numeric'], df['temp_c'], df['depth_m'],
            c=df['depth_m'], cmap='coolwarm', alpha=0.7, s=20
        )

        ax.set_xlabel('Time (days since first measurement)', labelpad=15)
        ax.set_ylabel('Temperature (°C)', labelpad=15)
        ax.set_zlabel('Depth (m)', labelpad=15)
        ax.set_title(f'3D Temperature Time Series - Floater {platform_id}', pad=20)

        ax.invert_zaxis()  # Invert depth axis

        cbar = fig.colorbar(scatter, ax=ax, pad=0.1)
        cbar.set_label('Depth (m)')

        ax.view_init(elev=20, azim=45)
        plt.show()

        return self._plot_to_base64()

    def plot_3d_salinity_timeseries(self, platform_id: str) -> str:
        """Create 3D salinity timeseries with depth as third dimension"""
        con = self.get_connection()
        query = f"""
        SELECT date, sal_psu, depth_m,temp_c
        FROM argo2023_slim 
        WHERE platform_id = '{platform_id}' 
        AND sal_psu IS NOT NULL
        ORDER BY date, depth_m
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        df['date_numeric'] = (df['date'] - df['date'].min()).dt.total_seconds() / 86400

        fig = plt.figure(figsize=(14, 10))
        ax = fig.add_subplot(111, projection='3d')

        scatter = ax.scatter(
            df['date_numeric'], df['sal_psu'], df['temp_c'],
            c=df['depth_m'], cmap='viridis', alpha=0.7, s=20
        )

        ax.set_xlabel('Time (days since first measurement)', labelpad=15)
        ax.set_ylabel('Salinity (PSU)', labelpad=15)
        ax.set_zlabel('Temperature (°C)', labelpad=15)
        ax.set_title(f'3D Salinity Time Series - Floater {platform_id}', pad=20)

        ax.invert_zaxis()

        cbar = fig.colorbar(scatter, ax=ax, pad=0.1)
        cbar.set_label('Depth (m)')

        ax.view_init(elev=20, azim=45)
        plt.show()

        return self._plot_to_base64()

    def plot_3d_temperature_salinity(self, platform_id: str) -> str:
        """Create 3D T-S diagram with depth as third dimension"""
        con = self.get_connection()
        query = f"""
        SELECT temp_c, sal_psu, depth_m, date
        FROM argo2023_slim 
        WHERE platform_id = '{platform_id}' 
        AND temp_c IS NOT NULL 
        AND sal_psu IS NOT NULL
        ORDER BY depth_m
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        fig = plt.figure(figsize=(14, 10))
        ax = fig.add_subplot(111, projection='3d')

        scatter = ax.scatter(
            df['sal_psu'], df['temp_c'], df['depth_m'],
            c=df['depth_m'], cmap='viridis_r', alpha=0.7, s=30
        )

        ax.set_xlabel('Salinity (PSU)', labelpad=15)
        ax.set_ylabel('Temperature (°C)', labelpad=15)
        ax.set_zlabel('Depth (m)', labelpad=15)
        ax.set_title(f'3D T-S Diagram - Floater {platform_id}', pad=20)

        ax.invert_zaxis()

        cbar = fig.colorbar(scatter, ax=ax, pad=0.1)
        cbar.set_label('Depth (m)')

        ax.view_init(elev=20, azim=45)
        plt.show()

        return self._plot_to_base64()

    def plot_3d_floater_trajectory(self, platform_id: str) -> str:
        """Create 3D trajectory with time as third dimension"""
        con = self.get_connection()
        query = f"""
        SELECT lon, lat, date, depth_m
        FROM argo2023_slim 
        WHERE platform_id = '{platform_id}' 
        AND lat IS NOT NULL 
        AND lon IS NOT NULL
        ORDER BY date
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        # Convert date to numeric
        df['date_numeric'] = (df['date'] - df['date'].min()).dt.total_seconds() / 86400

        fig = plt.figure(figsize=(14, 10))
        ax = fig.add_subplot(111, projection='3d')

        scatter = ax.scatter(
            df['lon'], df['lat'], df['date_numeric'],
            c=df['depth_m'], cmap='plasma', alpha=0.7, s=30
        )

        ax.set_xlabel('Longitude', labelpad=15)
        ax.set_ylabel('Latitude', labelpad=15)
        ax.set_zlabel('Time (days since first measurement)', labelpad=15)
        ax.set_title(f'3D Trajectory - Floater {platform_id}', pad=20)

        cbar = fig.colorbar(scatter, ax=ax, pad=0.1)
        cbar.set_label('Depth (m)')

        ax.view_init(elev=20, azim=45)
        plt.show()

        return self._plot_to_base64()

    def plot_3d_tsd_profile(self, platform_id: str) -> str:
        """Create 3D Temperature-Salinity-Depth profile plot"""
        con = self.get_connection()
        query = f"""
        SELECT temp_c, sal_psu, depth_m, date
        FROM argo2023_slim 
        WHERE platform_id = '{platform_id}' 
        AND temp_c IS NOT NULL 
        AND sal_psu IS NOT NULL 
        AND depth_m IS NOT NULL
        ORDER BY date, depth_m
        """

        df = con.execute(query).fetchdf()

        if df.empty:
            return None

        # Create 3D plot
        fig = plt.figure(figsize=(14, 10))
        ax = fig.add_subplot(111, projection='3d')

        # Scatter plot with color by depth
        scatter = ax.scatter(
            df['sal_psu'], df['temp_c'], df['depth_m'],
            c=df['depth_m'], cmap='viridis_r', alpha=0.7, s=30
        )

        # Labels and title
        ax.set_xlabel('Salinity (PSU)', labelpad=15)
        ax.set_ylabel('Temperature (°C)', labelpad=15)
        ax.set_zlabel('Depth (m)', labelpad=15)
        ax.set_title(f'3D T-S-D Profile - Floater {platform_id}', pad=20)

        # Invert depth axis (depth increases downward)
        ax.invert_zaxis()

        # Add colorbar
        cbar = fig.colorbar(scatter, ax=ax, pad=0.1)
        cbar.set_label('Depth (m)')

        # Adjust viewing angle
        ax.view_init(elev=20, azim=45)
        plt.show()

        return self._plot_to_base64()

    def get_all_3d_graphs_for_floater(self, platform_id: str) -> Dict[str, str]:
        """Generate all available 3D graphs for a specific floater"""
        graphs = {}

        graphs['3d_temperature_profile'] = self.plot_3d_temperature_profile(platform_id)
        graphs['3d_salinity_profile'] = self.plot_3d_salinity_profile(platform_id)
        graphs['3d_temperature_timeseries'] = self.plot_3d_temperature_timeseries(platform_id)
        graphs['3d_salinity_timeseries'] = self.plot_3d_salinity_timeseries(platform_id)
        graphs['3d_ts_diagram'] = self.plot_3d_temperature_salinity(platform_id)
        graphs['3d_trajectory'] = self.plot_3d_floater_trajectory(platform_id)
        graphs['3d_tsd_profile'] = self.plot_3d_tsd_profile(platform_id)

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
def create_3d_floater_graphs(platform_id: str, db_path: str = '../LOCAL/Resources/argo.db') -> Dict[str, str]:
    """Convenience function to create all 3D graphs for a floater"""
    generator = OceanGraphGenerator(db_path)
    try:
        return generator.get_all_3d_graphs_for_floater(platform_id)
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
    # Test the 3D functions
    generator = OceanGraphGenerator()

    # Get all available floater IDs
    floater_ids = generator.get_all_floater_ids()
    print(f"Available floater IDs: {floater_ids[:5]}...")  # Show first 5

    if floater_ids:
        # Test with first floater
        test_floater = floater_ids[0]
        print(f"\nGenerating 3D graphs for floater: {test_floater}")

        # Get all 3D graphs
        graphs_3d = generator.get_all_3d_graphs_for_floater(test_floater)
        print(f"Generated {len(graphs_3d)} 3D graphs")

        # Show available 3D graph types
        print("Available 3D graphs:", list(graphs_3d.keys()))

    generator.close_connection()