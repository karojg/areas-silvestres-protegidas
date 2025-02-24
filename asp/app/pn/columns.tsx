"use client";

import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  gml_id: string;
  codigo: number;
  status: "pending" | "processing" | "success" | "failed";
  nombre_asp: string;
};

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "gml_id",
    header: "gml_id",
  },
  {
    accessorKey: "codigo",
    header: "codigo",
  },
  {
    accessorKey: "status",
    header: "status",
  },
  {
    accessorKey: "nombre_asp",
    header: "nombre_asp",
  },
];
