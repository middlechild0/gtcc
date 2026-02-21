import baseConfig from "@visyx/ui/tailwind.config";
import type { Config } from "tailwindcss";

export default {
  ...baseConfig,
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
} satisfies Config;
