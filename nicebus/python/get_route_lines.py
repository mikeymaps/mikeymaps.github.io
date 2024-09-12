"""Creates a GeoJSON of the Long Island Bus network.

Sources the Long Island Index Map - http://www.longislandindexmaps.org/
Returns Suffolk County buses, but these are ignored.

Creates a GeoJSON stored in the data directory.
"""

# Imports
import geopandas as gpd
import pandas as pd
import requests
import os

DATA_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "data"))

response = requests.get("http://www.longislandindexmaps.org/api/busroutes/")

wkts = []
route_ids = []
route_names = []
route_labels = []

for lines in response.json():
	wkts.append(lines["wkt"])
	route_ids.append(lines["id"])
	route_names.append(lines["route"])
	route_labels.append(lines["label"])

	print(lines["label"])

series = gpd.GeoSeries.from_wkt(wkts).set_crs(3857)
gdf = gpd.GeoDataFrame({
	"id": pd.Series(route_ids),
	"route": pd.Series(route_names),
	"label": pd.Series(route_labels),
	"geometry": series.to_crs(4326)})

geojson_path = os.path.join(DATA_DIR, "bus_lines.json")

gdf.to_file(geojson_path, driver="GeoJSON")
