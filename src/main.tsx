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
import OrderHistoryPage from "./assets/pages/OrderHistoryPage.tsx";
import {AuthProviderProvider} from "./assets/providers/AuthProviderProvider.tsx";
import {ThemeProvider} from "./assets/providers/ThemeProvider.tsx";
import {Toaster} from "sonner";

export const setTitle = (title?: string) => document.title = title ? `${title} - Store Orders` : "Store Orders";


ReactDOM.createRoot($("#root")[0]!).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <AuthProviderProvider>
                    <CartProvider>
                        <MainContentRenderer/>
                    </CartProvider>
                </AuthProviderProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>
);

export function MainContentRenderer()
{
    setTitle();
    applyTheme();
    const navigate = useNavigate();
    return (
        <NextUIProvider navigate={navigate}>
            <Toaster position={"bottom-right"} closeButton richColors theme={"dark"} toastOptions={{
                className: "bg-default/50 border-2 border-primary/50 rounded-md shadow-lg backdrop-blur-sm"
            }}/>
            <Navigation/>
            <Routes>
                <Route>
                    <Route path="/" element={<OrderHistoryPage/>}/>
                    <Route path="/catalog" element={<CatalogPage/>}/>
                </Route>
            </Routes>
        </NextUIProvider>
    );
}
