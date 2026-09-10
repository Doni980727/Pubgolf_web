import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PubGolf",
    short_name: "PubGolf",
    description: "Pub golf scorecard och Wheel of Doom",
    start_url: "/",
    display: "standalone",
    background_color: "#1C0F02",
    theme_color: "#1C0F02",
    orientation: "portrait",
  };
}
