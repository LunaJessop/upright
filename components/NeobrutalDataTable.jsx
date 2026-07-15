"use client";

import { useEffect, useRef } from "react";
import "./neobrutal-datatables.css";

export default function NeobrutalDataTable({ rows, onRowClick }) {
  const tableRef = useRef(null);
  const apiRef = useRef(null);
  const onRowClickRef = useRef(onRowClick);
  onRowClickRef.current = onRowClick;

  useEffect(
    () => {
      if (!tableRef.current) return undefined;

      let destroyed = false;

      const tableEl = tableRef.current;

      (async () => {
        const $ = (await import("jquery")).default;
        await import("datatables.net");
        if (destroyed || !tableRef.current) return;
        apiRef.current = $(tableRef.current).DataTable({
          data: rows,
          autoWidth: false,
          columns: [
            { data: "name", title: "Part name" },
            {
              data: null,
              title: "Vendor part / Lot SKU",
              defaultContent: "—",
              render: (_data, _type, row) => {
                const isMake =
                  row.make_or_buy === "make" ||
                  row.make_or_buy === true ||
                  row.make_or_buy === "true";
                if (isMake) {
                  const lotSkus = Array.isArray(row.item_skus) ? row.item_skus : [];
                  if (lotSkus.length === 0) return "—";
                  if (lotSkus.length === 1) return lotSkus[0].sku;
                  return `${lotSkus.length} lot SKUs`;
                }
                return row.sku || "—";
              },
            },
            { data: "description", title: "Description", defaultContent: "" },
            { data: "make_or_buy", title: "Make or Buy", defaultContent: "" },
            { data: "unit_of_measure", title: "Units", defaultContent: "" },
            { data: "default_unit_price", title: "List price", defaultContent: "" },
            {
              data: "active",
              title: "Active",
              defaultContent: "",
              render: (value) => (value === true ? "Yes" : value === false ? "No" : ""),
            },
            {
              data: "vendor_name",
              title: "Vendor",
              defaultContent: "",
              render: (_value, _type, row) =>
                row.vendor_name || (row.vendor != null ? `Vendor #${row.vendor}` : ""),
            },
            {
              data: "bom_items",
              title: "BOM",
              defaultContent: "—",
              render: (value) =>
                Array.isArray(value) && value.length > 0
                  ? `${value.length} component${value.length === 1 ? "" : "s"}`
                  : "—",
            },
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

        $(tableEl).on("click.brutalRow", "tbody tr", function () {
          const handler = onRowClickRef.current;
          if (!handler || !apiRef.current) return;
          const rowData = apiRef.current.row(this).data();
          if (rowData) handler(rowData);
        });
      })();

      return () => {
        destroyed = true;
        if (apiRef.current) {
          apiRef.current.destroy();
          apiRef.current = null;
        }
        import("jquery").then(({ default: $ }) => {
          $(tableEl).off("click.brutalRow");
        });
      };
    },
    [rows]
  );

  return (
    <div
      className={`brutal-dt w-full min-w-0 max-w-full ${
        onRowClick ? "brutal-dt--clickable" : ""
      }`}
    >
      <table ref={tableRef} className="w-full" />
    </div>
  );
}
