import React from "react";
import {BrowserRouter, Route, Routes, useNavigate} from "react-router-dom";
import ReactDOM from "react-dom/client";
import $ from "jquery";
import {NextUIProvider} from "@nextui-org/react";

import "./assets/scss/index.scss";
import CatalogPage from "./assets/pages/CatalogPage.tsx";
import Navigation from "./assets/components/Navigation.tsx";
import {applyTheme} from "./assets/ts/Theme.ts";
import {CartProvider} from "./assets/providers/CartProvider.tsx";


ReactDOM.createRoot($("#root")[0]!).render(
    <React.StrictMode>
        <BrowserRouter>
            <CartProvider>
                <MainContentRenderer/>
            </CartProvider>
        </BrowserRouter>
    </React.StrictMode>
);

export function MainContentRenderer()
{
    applyTheme();
    const navigate = useNavigate();
    return (
        <NextUIProvider navigate={navigate}>
            <Navigation/>
            <Routes>
                <Route>
                    <Route path="/" element={<CatalogPage/>}/>
                </Route>
            </Routes>
        </NextUIProvider>
    );
}
