import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-400-italic.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/miniver/latin-400.css";
import "@fontsource/noto-sans-ethiopic";
import "./styles/index.css";
import "./styles/ui-polish.css";
import "./styles/home.css";
import "./styles/hero-modern.css";
import "./styles/menu-theme.css";
import "./styles/menu-modern.css";
import "./styles/menu-enter.css";
import "./styles/not-found.css";
import App from "./App";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
