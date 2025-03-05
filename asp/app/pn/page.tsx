// Page.js
"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { DataTable } from "./data-table";
import RealtimeListener from "./RealtimeListener";
import { columns } from "./columns";
const DynamicMap = dynamic(() => import("./map"), { ssr: false });

export default function Page() {
  const [datas, setData] = useState([]);

  // Fetch the data
  const fetchData = async () => {
    const { data, error } = await supabase.from("pn").select();
    if (error) {
      console.error("❌ Error fetching data:", error);
      return;
    }
    console.log("✅ Data from Supabase:", data); // Check that each row has { id, visited, geojson, ... }
    setData([...data]); // new reference for React
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <DataTable columns={columns} data={datas} onDataUpdate={fetchData} />
      <DynamicMap data={datas} onDataUpdate={fetchData} />
    </div>
  );
}
