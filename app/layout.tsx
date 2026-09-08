import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { EditModeProvider } from "@/components/EditModeContext";
import AdminBar from "@/components/AdminBar";
import PageTransition from "@/components/PageTransition";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Vextio — Vintage Inspired Clothing",
  description:
    "Timeless silhouettes reborn for the modern wardrobe. Heritage fabrics, handcrafted pieces, small batch production.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${dmSans.variable} font-body bg-cream text-brown antialiased`}
      >
        <EditModeProvider>
          <CartProvider>
            <PageTransition>{children}</PageTransition>
            <AdminBar />
          </CartProvider>
        </EditModeProvider>
      </body>
    </html>
  );
}
