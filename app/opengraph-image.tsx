import { ImageResponse } from "next/og";

export const alt = "TaskFlow: Your Team's Work, Finally in One Place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #1b4ddb 0%, #143bb0 55%, #0b766f 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
              padding: "0 14px",
            }}
          >
            <div style={{ height: 6, width: 24, borderRadius: 3, background: "white" }} />
            <div style={{ height: 6, width: 36, borderRadius: 3, background: "white" }} />
            <div style={{ height: 6, width: 20, borderRadius: 3, background: "white" }} />
          </div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>TaskFlow</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
            Your Team&apos;s Work, Finally in One Place
          </div>
          <div style={{ fontSize: 32, opacity: 0.85 }}>
            Boards, timelines and chat for small teams · 14-day free trial
          </div>
        </div>
      </div>
    ),
    size,
  );
}
