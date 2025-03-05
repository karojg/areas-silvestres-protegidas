"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@supabase/supabase-js";

// Helper component to update map view on center change
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const ChoroplethMap = ({ data = [], onDataUpdate, center }) => {
  const [geoData, setGeoData] = useState([]);

  useEffect(() => {
    console.log("🔄 Updating geoData from data: %o", data);

    if (Array.isArray(data) && data.length > 0) {
      const updatedGeoData = data
        .map((park) => {
          let geojson = {};
          try {
            geojson =
              typeof park.geojson === "string"
                ? JSON.parse(park.geojson)
                : park.geojson;
          } catch (error) {
            console.error("❌ Error parsing geojson: %o", error);
            return null;
          }

          return geojson
            ? {
                ...geojson,
                features: (geojson.features || []).map((feature) => ({
                  ...feature,
                  properties: {
                    ...feature.properties,
                    visited: park.visited, // Ensure visited updates from Supabase
                    id: park.id, // Unique id for each feature
                  },
                })),
              }
            : null;
        })
        .filter(Boolean);

      setGeoData([...updatedGeoData]); // Ensure React detects change
    }
  }, [data]); // Triggers update when `data` changes

  const toggleVisited = async (feature) => {
    const updatedVisited = !feature.properties.visited;
    console.log("🔄 Toggling visited for: %o", feature.properties.nombre_asp);

    const { error } = await supabase
      .from("national_parks")
      .update({ visited: updatedVisited })
      .eq("id", feature.properties.id);

    if (error) {
      console.error("❌ Error updating visited status: %o", error);
      return;
    }

    console.log("✅ Visited status updated!");

    // **Optimistic UI Update**
    setGeoData((prevGeoData) =>
      prevGeoData.map((geojson) => ({
        ...geojson,
        features: geojson.features.map((f) =>
          f.properties.id === feature.properties.id
            ? { ...f, properties: { ...f.properties, visited: updatedVisited } }
            : f
        ),
      }))
    );

    // **Fetch Latest Data from Supabase**
    onDataUpdate();
  };

  const styleFeature = (feature) => ({
    fillColor: feature.properties.visited ? "green" : "red",
    weight: 2,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7,
  });

  return (
    <MapContainer
      center={center}
      zoom={8}
      style={{ height: "500px", width: "100%" }}
    >
      {/* This component updates the view when `center` changes */}
      <ChangeView center={center} zoom={8} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {geoData.map((geojson, index) => (
        <GeoJSON
          key={`${index}-${geojson.features?.[0]?.properties?.visited}`}
          data={geojson}
          style={styleFeature}
          onEachFeature={(feature, layer) => {
            console.log(
              "🟢 Feature visited (live update): %o",
              feature.properties.visited
            );
            layer.on("click", () => toggleVisited(feature));
            layer.bindPopup(
              `<b>${feature.properties.nombre_asp || "Unknown"}</b><br>Visited: ${
                feature.properties.visited ? "Yes" : "No"
              }`
            );
            layer.on("mouseover", function () {
              this.openPopup();
            });
            layer.on("mouseout", function () {
              this.closePopup();
            });
          }}
        />
      ))}
    </MapContainer>
  );
};

export default ChoroplethMap;
