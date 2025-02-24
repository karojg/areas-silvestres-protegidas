"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ChoroplethMap = () => {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    const fetchGeoJSON = async () => {
      const { data, error } = await supabase
        .from("pn")
        .select("geojson, visited");

      if (!error && data) {
        const formattedData = {
          type: "FeatureCollection",
          features: data.flatMap((park) => {
            // Ensure geojson is properly parsed
            const geojson =
              typeof park.geojson === "string"
                ? JSON.parse(park.geojson) // If it's a string, parse it
                : park.geojson; // Otherwise, use as is

            return geojson.features.map((feature) => ({
              ...feature,
              properties: { ...feature.properties, visited: park.visited },
            }));
          }),
        };
        setGeoData(formattedData);
      }
    };
    fetchGeoJSON();
  }, []);

  const toggleVisited = async (feature, layer) => {
    const parkId = feature.properties.id;
    const newStatus = !feature.properties.visited;

    const { error } = await supabase
      .from("pn")
      .update({ visited: newStatus })
      .eq("id", parkId);

    if (!error) {
      setGeoData((prevGeoData) => {
        return {
          ...prevGeoData,
          features: prevGeoData.features.map((f) =>
            f.properties.id === parkId
              ? { ...f, properties: { ...f.properties, visited: newStatus } }
              : f
          ),
        };
      });
    }
  };

  const styleFeature = (feature) => {
    return {
      fillColor: feature.properties.visited ? "green" : "red",
      weight: 2,
      opacity: 1,
      color: "white",
      fillOpacity: 0.7,
    };
  };

  return (
    <MapContainer
      center={[10, -84]}
      zoom={8}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {geoData && (
        <GeoJSON
          data={geoData}
          style={styleFeature}
          onEachFeature={(feature, layer) => {
            layer.on("click", () => toggleVisited(feature, layer));
            layer.bindPopup(
              `<b>${feature.properties.name}</b><br>Visited: ${feature.properties.visited ? "Yes" : "No"}`
            );

            // Show popup on hover
            layer.on("mouseover", function () {
              this.openPopup();
            });
            layer.on("mouseout", function () {
              this.closePopup();
            });
          }}
        />
      )}
    </MapContainer>
  );
};

export default ChoroplethMap;
