"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { DataTable } from "./data-table";
import RealtimeListener from "./RealtimeListener";
import { columns } from "./columns";
import L from "leaflet"; // Import Leaflet to compute center

const DynamicMap = dynamic(() => import("./map"), { ssr: false });

// Helper to compute the center from geoJSON using Leaflet
function computeGeoJSONCenter(geojson) {
  let parsed = typeof geojson === "string" ? JSON.parse(geojson) : geojson;
  const layer = L.geoJSON(parsed);
  const bounds = layer.getBounds();
  const center = bounds.getCenter();
  return [center.lat, center.lng]; // Construct the center array manually
}

export default function Page() {
  const [datas, setData] = useState([]);
  const [mapCenter, setMapCenter] = useState([10, -84]); // Default center

  const fetchData = async () => {
    console.log("🔄 Fetching data from Supabase...");
    const { data, error } = await supabase.from("pn").select();

    if (error) {
      console.error("❌ Error fetching data: %o", error);
    } else {
      console.log("✅ New Data: %o", data);
      setData([...data]); // Ensures a new reference for React to detect changes
    }
  };

  // Callback to update the center when a row is clicked
  const handleRowClick = (rowData) => {
    // Compute the center from the geojson field of the row data
    const newCenter = computeGeoJSONCenter(rowData.geojson);
    console.log("🔄 New map center computed: %o", newCenter);
    setMapCenter(newCenter);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <RealtimeListener onUpdate={fetchData} />

      <DataTable
        columns={columns}
        data={datas}
        onDataUpdate={fetchData}
        onRowClick={handleRowClick} // Pass the callback down
      />
      <DynamicMapWrapper
        data={datas}
        onDataUpdate={fetchData}
        center={mapCenter} // Pass current center to map
      />
    </div>
  );
}

const DynamicMapWrapper = (props) => <DynamicMap {...props} />;
