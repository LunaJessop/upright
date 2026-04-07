"use client";

import { useEffect, useRef } from "react";
import "./neobrutal-datatables.css";

/** Sample MRP-style rows for the style lab; replace with real data in app routes. */
const DEMO_ROWS = [
  {
    sku: "BRK-6204",
    part: "Ball bearing 6204-2RS",
    qty: 240,
    bin: "A-12",
    status: "In stock",
  },
  {
    sku: "SHF-16MM",
    part: "Linear shaft 16×500 mm",
    qty: 18,
    bin: "B-04",
    status: "In stock",
  },
  {
    sku: "PLT-6AL",
    part: "Plate 6mm 6061-T6",
    qty: 0,
    bin: "C-22",
    status: "Backorder",
  },
  {
    sku: "BOLT-M8-25",
    part: "SHCS M8×25 (DIN 912)",
    qty: 1200,
    bin: "D-01",
    status: "In stock",
  },
  {
    sku: "BELT-HTD5-15",
    part: "HTD5M belt 15 mm × 800",
    qty: 6,
    bin: "E-09",
    status: "Low",
  },
  {
    sku: "PUL-20T5",
    part: "Aluminum pulley 20T 5M",
    qty: 14,
    bin: "E-09",
    status: "In stock",
  },
  {
    sku: "COUP-8-8",
    part: "Rigid coupling 8 mm–8 mm",
    qty: 32,
    bin: "A-03",
    status: "In stock",
  },
  {
    sku: "WIRE-18AWG",
    part: "Hook-up wire 18 AWG red",
    qty: 150,
    bin: "F-14",
    status: "In stock",
  },
  {
    sku: "PCB-MDRV",
    part: "Motor driver PCB rev C",
    qty: 45,
    bin: "G-02",
    status: "In stock",
  },
  {
    sku: "ENC-AS5",
    part: "Incremental encoder 500 CPR",
    qty: 2,
    bin: "G-05",
    status: "Low",
  },
  {
    sku: "HOUS-AL-EX",
    part: "Extrusion housing custom",
    qty: 0,
    bin: "—",
    status: "Planned",
  },
  {
    sku: "ORING-24",
    part: "O-ring 24×2 NBR70",
    qty: 500,
    bin: "H-01",
    status: "In stock",
  },
];

export default function NeobrutalDataTable() {
  const tableRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (!tableRef.current) return undefined;

    let destroyed = false;

    (async () => {
      const $ = (await import("jquery")).default;
      await import("datatables.net");
      if (destroyed || !tableRef.current) return;

      apiRef.current = $(tableRef.current).DataTable({
        data: DEMO_ROWS,
        columns: [
          { data: "sku", title: "SKU" },
          { data: "part", title: "Part name" },
          {
            data: "qty",
            title: "Qty",
            render: (data) =>
              typeof data === "number"
                ? data.toLocaleString()
                : String(data),
          },
          { data: "bin", title: "Bin" },
          { data: "status", title: "Status" },
        ],
        layout: {
          topStart: "pageLength",
          topEnd: "search",
          bottomStart: "info",
          bottomEnd: "paging",
        },
        pageLength: 5,
        lengthMenu: [
          [5, 10, 25, -1],
          [5, 10, 25, "All"],
        ],
        order: [[0, "asc"]],
      });
    })();

    return () => {
      destroyed = true;
      if (apiRef.current) {
        apiRef.current.destroy();
        apiRef.current = null;
      }
    };
  }, []);

  return (
    <div className="brutal-dt">
      <table ref={tableRef} className="w-full" />
    </div>
  );
}
