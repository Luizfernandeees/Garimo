import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "GARIMO: boas descobertas, bons preços";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const fontDir = join(process.cwd(), "node_modules/@fontsource/poppins/files");
  const [extraBold, semiBold] = await Promise.all([
    readFile(join(fontDir, "poppins-latin-800-normal.woff")),
    readFile(join(fontDir, "poppins-latin-600-normal.woff")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFF4EA",
          padding: "72px 80px",
          fontFamily: "Poppins",
          color: "#292929",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="96" height="86" viewBox="0 0 72 64" fill="none" stroke="#F07842" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M25 21v-3.5a9.5 9.5 0 0 1 19 0V21" />
            <path d="M20 21h28q4 0 4.6 4l3.8 29q.6 4-3.4 4H15q-4 0-3.4-4l3.8-29q.6-4 4.6-4z" />
            <path d="M25.5 34c4 8 13.5 8 17.5 0" />
            <path d="M55.5 6.5l-2.3 6" />
            <path d="M60 15.5l5.5-3.4" />
            <path d="M61 23l6.5 1.2" />
          </svg>
          <span style={{ fontSize: 72, fontWeight: 800, letterSpacing: "-0.04em" }}>garimo</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.035em" }}>
            Boas descobertas, bons preços.
          </span>
          <span style={{ fontSize: 30, fontWeight: 600, marginTop: 24, color: "#5c5c5c" }}>
            Produtos e ofertas da Shopee selecionados pela GARIMO
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Poppins", data: extraBold, weight: 800, style: "normal" },
        { name: "Poppins", data: semiBold, weight: 600, style: "normal" },
      ],
    },
  );
}
