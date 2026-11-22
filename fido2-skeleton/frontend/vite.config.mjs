import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
    build: {
        rolldownOptions: {
            input: {
                main: resolve(import.meta.dirname, "index.html"),
                dashboard: resolve(import.meta.dirname, "dashboard.html"),
		push: resolve(import.meta.dirname, "push.html"),
                pushApprove: resolve(import.meta.dirname, "push-approve.html")
            }
        }
    }
});
