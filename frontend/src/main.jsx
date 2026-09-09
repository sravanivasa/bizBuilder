import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store";
import "./i18n";
import "./index.css";
import App from "./App.jsx";
import AuthBootstrap from "./components/AuthBootstrap.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <AuthBootstrap>
                <App />
            </AuthBootstrap>
        </Provider>
    </StrictMode>
);
