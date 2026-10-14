import Link from "next/link";
import Splash from "./Splash";

export default function Cta() {
  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-leaf px-6 py-14 text-canvas shadow-hard sm:px-12">
        <Splash color="#F2A900" className="-right-10 -top-10 h-48 w-48 opacity-90" />
        <Splash color="#1F6FB2" className="-bottom-16 right-32 h-40 w-40 opacity-70" />
        <div className="relative max-w-2xl">
          <p className="font-hand text-3xl text-marigold">Two ways to help</p>
          <h2 className="mt-2 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Pick up a brush, or pick up a shirt.
          </h2>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/join" className="btn bg-marigold text-ink">Apply to paint</Link>
            <Link href="/shop" className="btn bg-canvas text-ink">Shop the shirts</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
