"use client";

import { useEffect, useRef } from "react";
import "./neobrutal-datatables.css";

export default function NeobrutalDataTable({ rows }) {
  const tableRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(
    () => {
      if (!tableRef.current) return undefined;

      let destroyed = false;

      (async () => {
        const $ = (await import("jquery")).default;
        await import("datatables.net");
        if (destroyed || !tableRef.current) return;
        apiRef.current = $(tableRef.current).DataTable({
          data: rows,
          autoWidth: false,
          columns: [
            { data: "organization_id", title: "Company" },
            { data: "name", title: "Part name" },
            { data: "sku", title: "Sku" },
            { data: "description", title: "Description" },
            { data: "item_type", title: "Type" },
            { data: "make_or_buy", title: " Make or Buy" },
            { data: "unit_of_measure", title: "Units" },
            { data: "default_cost", title: "Cost" },
            { data: "active", title: "Active" },
            { data: "vendor", title: "Vendor" },
            { data: "bom", title: "BOM" }
          ],
          layout: {
            topStart: "pageLength",
            topEnd: "search",
            bottomStart: "info",
            bottomEnd: "paging"
          },
          pageLength: 5,
          lengthMenu: [[5, 10, 25, -1], [5, 10, 25, "All"]],
          order: [[0, "asc"]]
        });
      })();

      return () => {
        destroyed = true;
        if (apiRef.current) {
          apiRef.current.destroy();
          apiRef.current = null;
        }
      };
    },
    [rows]
  );

  return (
    <div className="brutal-dt w-full min-w-0 max-w-full">
      <table ref={tableRef} className="w-full" />
    </div>
  );
}
