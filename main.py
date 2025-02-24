import geopandas as gpd
import duckdb

# Load your GeoDataFrame
gdf = gpd.read_file("data.geojson", engine="fiona")

# Convert 'geometry' column to WKT (if it isn't already)
gdf['geometry'] = gdf['geometry'].apply(lambda geom: geom.wkt)

# Save to DuckDB
conn = duckdb.connect("geodatas.duckdb")
conn.execute("CREATE TABLE geodata AS SELECT * FROM gdf")
conn.close()
