import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le "base" doit correspondre au nom de ton dépôt GitHub pour que GitHub Pages
// serve les fichiers au bon chemin (https://<user>.github.io/<repo>/).
// Remplace "suivi-poids" si tu nommes ton dépôt différemment.
export default defineConfig({
  plugins: [react()],
  base: "/suivi-poids/",
});
