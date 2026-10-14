import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#133621", padding: 72, gap: 64, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, color: "#f4d96c" }}>
          <div style={{ fontSize: 34, letterSpacing: 2 }}>PAINTED FOR PURPOSE</div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.95, marginTop: 24 }}>Paint a shirt.</div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 0.95 }}>Fund flood relief.</div>
          <div style={{ fontSize: 30, marginTop: 36, color: "#f6eedb" }}>Half of every sale goes to flood relief charities in Pakistan.</div>
        </div>
        <div style={{ display: "flex", width: 260, height: 330, position: "relative" }}>
          <div style={{ display: "flex", width: 130, height: 330, background: "#f4d96c" }} />
          <div style={{ display: "flex", width: 130, height: 330, background: "#f6eedb" }} />
          <div style={{ position: "absolute", top: 34, left: 112, width: 36, height: 36, borderRadius: 18, background: "#133621" }} />
          <div style={{ position: "absolute", bottom: 60, left: 0, width: 260, display: "flex", justifyContent: "center", fontSize: 110, fontWeight: 800, color: "#133621" }}>50/50</div>
        </div>
      </div>
    ),
    size,
  );
}
