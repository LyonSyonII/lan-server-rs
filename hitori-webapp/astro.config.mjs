import icon from "astro-icon";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	integrations: [
		icon(),
		/* 		AutoImport({
			dts: true,
			dirs: ["./src/auto-import/**"],
		}), */
	],
});
