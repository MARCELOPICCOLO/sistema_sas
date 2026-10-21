import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { FeedbackHost } from "./components/Feedback";
import { installAuthInterceptors } from "./api/axios";
import { aplicarTema, temaInicial } from "./theme";
import "./index.css";

installAuthInterceptors();
aplicarTema(temaInicial());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <FeedbackHost />
    </BrowserRouter>
  </React.StrictMode>,
);
