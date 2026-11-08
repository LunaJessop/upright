"use client";

import AdminFrame from "@/components/AdminFrame";
import { brutalChrome } from "@/lib/chrome";

export default function AdminAuditPage() {
  return (
    <AdminFrame title="Audit" lede="A later view of admin actions.">
      <div className={`mt-4 ${brutalChrome} bg-nv-paper px-4 py-5`}>
        <h2 className="text-sm font-black uppercase">Not ready yet</h2>
        <p className="mt-2 text-sm font-medium text-nv-ink/70">
          Audit will list admin actions here. There is nothing to review yet.
        </p>
      </div>
    </AdminFrame>
  );
}
