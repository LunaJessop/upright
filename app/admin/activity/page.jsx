"use client";

import AdminFrame from "@/components/AdminFrame";
import { brutalChrome } from "@/lib/chrome";

export default function AdminActivityPage() {
  return (
    <AdminFrame
      title="Activity"
      lede="A later view of what shops have been doing."
    >
      <div className={`mt-4 ${brutalChrome} bg-nv-paper px-4 py-5`}>
        <h2 className="text-sm font-black uppercase">Not ready yet</h2>
        <p className="mt-2 text-sm font-medium text-nv-ink/70">
          Activity will show recent shop events here. There is nothing to review yet.
        </p>
      </div>
    </AdminFrame>
  );
}
