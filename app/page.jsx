"use client";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Upright</h1>
      <button className="text-blue-500" onClick={() => router.push("/testing")}>Testing</button>
    </main>
  );
}
