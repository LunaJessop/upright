import Image from "next/image";
import uprightLogo from "@/app/assets/upright-logo.png";

export default function Home() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-nv-canvas px-6 py-16 text-nv-ink">
      <div className="flex max-w-md flex-col items-center gap-6 border-brutal border-black bg-nv-paper p-10 text-center shadow-brutal">
        <Image
          src={uprightLogo}
          alt="Upright logo"
          className="h-auto w-48"
          priority
        />
        <h1 className="text-3xl font-black uppercase leading-tight">
          Welcome to Upright
        </h1>
        <p className="text-sm font-medium text-nv-ink/70">
          Track your items, recipes, and batches in one place. Use the navigation
          on the left to get started — browse your catalog under{" "}
          <span className="font-black">Items</span>, or check on orders in{" "}
          <span className="font-black">Sales</span> and{" "}
          <span className="font-black">Batches</span>.
        </p>
      </div>
    </main>
  );
}
