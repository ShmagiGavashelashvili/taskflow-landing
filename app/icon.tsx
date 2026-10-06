import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 3,
          padding: "0 7px",
          borderRadius: 9,
          background: "linear-gradient(135deg, #1b4ddb, #0fa89c)",
        }}
      >
        <div style={{ height: 3, width: 10, borderRadius: 2, background: "white" }} />
        <div style={{ height: 3, width: 18, borderRadius: 2, background: "white" }} />
        <div style={{ height: 3, width: 8, borderRadius: 2, background: "white" }} />
      </div>
    ),
    size,
  );
}
