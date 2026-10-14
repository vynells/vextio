import Link from "next/link";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-ink bg-ink text-canvas">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl font-bold">{site.name}</p>
          <p className="mt-3 max-w-xs text-canvas/70">{site.description}</p>
        </div>
        <div>
          <p className="font-hand text-2xl text-marigold">Explore</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/about" className="hover:text-marigold">About P4P</Link></li>
            <li><Link href="/impact" className="hover:text-marigold">Where the money goes</Link></li>
            <li><Link href="/shop" className="hover:text-marigold">Shop the shirts</Link></li>
            <li><Link href="/join" className="hover:text-marigold">Apply to paint</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-hand text-2xl text-marigold">Say hello</p>
          <ul className="mt-3 space-y-2">
            <li><a href={site.instagram} className="hover:text-marigold" target="_blank" rel="noreferrer">Instagram {site.instagramHandle}</a></li>
            <li><a href={`mailto:${site.email}`} className="hover:text-marigold">{site.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-canvas/20 px-4 py-5 text-center text-sm text-canvas/60">
        © {new Date().getFullYear()} {site.name}. Student-led, made by hand in Pakistan.
      </div>
    </footer>
  );
}
