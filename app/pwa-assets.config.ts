// Icons generated from public/logo.svg at build (forge-pwa → icons-and-assets). Replace the logo via /icons.
import { defineConfig, minimal2023Preset as preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...preset,
    // + 96 px: the icon of every manifest shortcut (forge-pwa → pwa §2).
    transparent: { ...preset.transparent, sizes: [64, 96, 192, 512] },
    apple: { ...preset.apple, resizeOptions: { background: "#F5F5F7", fit: "contain" } },
    maskable: { ...preset.maskable, resizeOptions: { background: "#F5F5F7", fit: "contain" } },
  },
  images: ["public/logo.svg"],
});
