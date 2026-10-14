import type { Metadata, Viewport } from "next";
import { Bebas_Neue, EB_Garamond } from "next/font/google";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import Reveal from "@/components/Reveal";
import { site } from "@/lib/site";
import "./globals.css";

const display = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" });
const serif = EB_Garamond({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} (P4P): ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: ["Painted For Purpose", "P4P", "flood relief", "Pakistan", "hand-painted T-shirts", "student NGO", "community service"],
  openGraph: { type: "website", siteName: site.name, locale: "en_PK", url: "/", title: `${site.name}: ${site.tagline}`, description: site.description },
  twitter: { card: "summary_large_image", title: `${site.name}: ${site.tagline}`, description: site.description },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#133621", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS as available before paint so reveal styles only hide content when they can show it again. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <Reveal />
      </body>
    </html>
  );
}
