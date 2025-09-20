import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { SnackbarProvider } from "notistack";
import logger from "./utils/logger";

const root = ReactDOM.createRoot(document.getElementById("root"));
logger.info("Frontend bootstrapping", {
  logLevel: logger.level,
  strategy: logger.strategy,
});
root.render(
  <React.StrictMode>
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <App />
    </SnackbarProvider>
  </React.StrictMode>
);
