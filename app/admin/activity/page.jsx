"use client";

import { useState } from "react";
import AdminActivityPanel from "@/components/AdminActivityPanel";
import AdminFrame from "@/components/AdminFrame";

export default function AdminActivityPage() {
  const [forbidden, setForbidden] = useState(false);
  return (
    <AdminFrame
      title="Activity"
      lede="Sign-ins, emails, and admin actions. Choose a type to narrow the list."
      forbidden={forbidden}
    >
      <AdminActivityPanel onForbidden={() => setForbidden(true)} />
    </AdminFrame>
  );
}
