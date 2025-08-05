import React from "react";
import {BrowserRouter, Route, Routes, useNavigate} from "react-router-dom";
import ReactDOM from "react-dom/client";
import $ from "jquery";

import "./css/index.css";
import Login from "./components/auth/Login";
import AppLayout from "./components/layout/AppLayout";
import {HeroUIProvider} from "@heroui/react";
import {AuthProvider} from "./providers/AuthProvider";
import {CartProvider} from "./providers/CartProvider";


ReactDOM.createRoot($("#root")[0]!).render(
    <React.StrictMode>
        <BrowserRouter>
            <MainContentRenderer/>
        </BrowserRouter>
    </React.StrictMode>
);

export function MainContentRenderer()
{
    const navigate = useNavigate();
    return (
        <HeroUIProvider navigate={navigate}>
            <AuthProvider>
                <CartProvider>
                    <Routes>
                        <Route path="/" element={<Login/>}/>
                        <Route path="/app/*" element={<AppLayout/>}/>
                    </Routes>
                </CartProvider>
            </AuthProvider>
        </HeroUIProvider>
    );
}
