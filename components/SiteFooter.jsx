export default function SiteFooter() {
  return (
    <footer className="bg-black/50 px-3 py-1 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white">
        © {new Date().getFullYear()} Upright
      </p>
    </footer>
  );
}
