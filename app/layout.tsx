import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PubGolf",
  description: "PubGolf – pub golf direkt i mobilen",
  applicationName: "PubGolf",
  icons: {
    icon: "https://raw.githubusercontent.com/TiZiZAAiT/Pubgolf/main/assets/images/icon_pubgolf.png",
    apple: "https://raw.githubusercontent.com/TiZiZAAiT/Pubgolf/main/assets/images/icon_pubgolf.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PubGolf",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1C0F02",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
