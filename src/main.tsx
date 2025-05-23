import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"; // Import ajouté

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Analytics />
  </>
);