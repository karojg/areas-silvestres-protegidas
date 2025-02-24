import { createClient } from "@/utils/supabase/server";
import { Payment, columns } from "./columns";
import { DataTable } from "./data-table";
import ChoroplethMap from "./map";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from("pn").select();
  console.log({ data });

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
      <ChoroplethMap />
    </div>
  );
}
