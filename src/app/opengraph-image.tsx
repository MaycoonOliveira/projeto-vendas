import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Cartão social gerado (Open Graph). Não depende das fotos da propriedade,
 * evitando questões de direitos de imagem no compartilhamento.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #33503f 0%, #2a4234 100%)",
          padding: "72px",
          color: "#f6f4ee",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, opacity: 0.85 }}>
          {siteConfig.location.city.toUpperCase()} · {siteConfig.location.state}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 92, lineHeight: 1 }}>{siteConfig.name}</div>
          <div style={{ fontSize: 40, opacity: 0.9 }}>{siteConfig.tagline}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
          <span
            style={{
              display: "flex",
              padding: "6px 18px",
              borderRadius: 999,
              background: "rgba(224,161,94,0.18)",
              color: "#e0a15e",
            }}
          >
            {siteConfig.reviews.rating.toFixed(1)} / 5
          </span>
          <span>
            {siteConfig.reviews.badge} no {siteConfig.reviews.source}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
