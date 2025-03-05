// map.js (ChoroplethMap)
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ChoroplethMap({ data = [], onDataUpdate }) {
  const [geoData, setGeoData] = useState([]);

  useEffect(() => {
    if (!Array.isArray(data)) return;

    const updatedGeoData = data
      .map((park) => {
        // park = { id: 123, visited: true, geojson: ... }
        if (!park.geojson) return null;

        let geojsonObject;
        try {
          geojsonObject =
            typeof park.geojson === "string"
              ? JSON.parse(park.geojson)
              : park.geojson;
        } catch (error) {
          console.error("Error parsing geojson:", error);
          return null;
        }

        // Attach DB id + visited to each feature
        return {
          ...geojsonObject,
          features: (geojsonObject.features || []).map((feature) => ({
            ...feature,
            properties: {
              ...feature.properties,
              visited: park.visited,
              id: park.id, // *** CRITICAL ***
            },
          })),
        };
      })
      .filter(Boolean);

    setGeoData([...updatedGeoData]);
  }, [data]);

  // Toggle visited in DB
  const toggleVisited = async (feature) => {
    const updatedVisited = !feature.properties.visited;
    console.log("Toggling visited for feature ID:", feature.properties.id);
    const { error } = await supabase
      .from("pn")
      .update({ visited: updatedVisited })
      .eq("id", feature.properties.id);

    if (error) {
      console.error("Error updating visited status:", error);
      return;
    }

    // Optimistic update
    setGeoData((prev) =>
      prev.map((geojson) => ({
        ...geojson,
        features: geojson.features.map((f) =>
          f.properties.id === feature.properties.id
            ? {
                ...f,
                properties: {
                  ...f.properties,
                  visited: updatedVisited,
                },
              }
            : f
        ),
      }))
    );

    // Re-fetch from Supabase
    onDataUpdate();
  };

  const styleFeature = (feature) => ({
    fillColor: feature.properties.visited ? "green" : "red",
    color: "white",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.7,
  });

  return (
    <MapContainer
      center={[10, -84]}
      zoom={8}
      style={{ height: 500, width: "100%" }}
    >
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
}
