import Link from "next/link";
import { instagramUrl, nav, shirts, site } from "@/lib/site";
import Tee from "./Tee";

// The back of the postcard: a message on the left, the address on the right, a stamp in the corner.
export default function Footer() {
  return (
    <footer className="pt-32 sm:pt-44">
      <div className="wrap">
        <div className="on-paper edge-scallop-top relative bg-paper px-6 pb-8 pt-16 text-green sm:px-12 sm:pt-20 lg:mx-[6%]">
          <div className="absolute right-6 top-14 w-16 rotate-3 bg-paper-2 p-1.5 sm:right-12 sm:top-16 sm:w-24" aria-hidden>
            <div className="bg-green p-1"><Tee shirt={shirts[0]} label="" /></div>
          </div>

          <div className="grid gap-12 md:grid-cols-2">
            <div className="max-w-md pr-20 md:pr-0">
              <p className="font-display text-[3.25rem] uppercase leading-[0.9]">Thank you for reading</p>
              <p className="mt-5">
                Every shirt on this site was painted by a student artist. Half of what you pay goes to flood relief
                charities in Pakistan; the other half paints the next batch.
              </p>
            </div>
            <div className="md:pt-28">
              <ul className="space-y-3 text-lead">
                <li><a className="link" href={instagramUrl} target="_blank" rel="noopener noreferrer">Instagram @{site.instagramHandle}</a></li>
                <li><a className="link" href={`mailto:${site.email}`}>{site.email}</a></li>
                <li><a className="link" href={site.applyForm} target="_blank" rel="noopener noreferrer">Apply to paint (Google Form)</a></li>
              </ul>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {nav.map((l) => (
                  <li key={l.href}><Link className="link" href={l.href}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-16 text-center text-small">
            © {new Date().getFullYear()} {site.name} · A student-led NGO, painted by hand in Pakistan
          </p>
        </div>
      </div>
      <p aria-hidden className="select-none overflow-hidden whitespace-nowrap pt-10 text-center font-display text-[12.6vw] uppercase leading-[0.8] text-green-3">
        {site.name}
      </p>
    </footer>
  );
}
