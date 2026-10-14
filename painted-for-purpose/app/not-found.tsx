import Link from "next/link";
import Tee from "@/components/Tee";
import { shirts } from "@/lib/site";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  const blank = { ...shirts[0], pattern: "drops" as const, colors: ["#fffdf6", "#fffdf6", "#fffdf6"] as [string, string, string] };
  return (
    <section className="wrap grid items-center gap-10 pb-10 pt-12 md:grid-cols-[1.2fr_1fr] md:pt-20">
      <div>
        <h1 className="text-giant">Not painted yet</h1>
        <p className="mt-8 max-w-[40ch] text-lead">This page is still a plain white shirt. The link may be old, or the page hasn’t been made.</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/" className="btn btn-gold">Back home <span className="arrow" aria-hidden>→</span></Link>
          <Link href="/shop" className="link self-center text-lead">See the shirts</Link>
        </div>
      </div>
      <Tee shirt={blank} label="A blank, unpainted white T-shirt" className="mx-auto w-full max-w-sm -rotate-3" />
    </section>
  );
}
