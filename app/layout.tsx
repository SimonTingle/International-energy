import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Energy Resources Dashboard",
  description: "Interactive map showing live energy resources per country",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
