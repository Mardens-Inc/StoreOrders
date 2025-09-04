import React from "react";
import {BrowserRouter, Route, Routes, useNavigate} from "react-router-dom";
import ReactDOM from "react-dom/client";

import "./css/index.css";
import Login from "./components/auth/Login";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import AppLayout from "./components/layout/AppLayout";
import {HeroUIProvider} from "@heroui/react";
import {ToastProvider} from "@heroui/toast";
import {AuthProvider} from "./providers/AuthProvider";
import {CartProvider} from "./providers/CartProvider";
import {LayoutProvider} from "./providers/LayoutProvider";
import {MessageProvider} from "./providers/MessageProvider.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";

const rootElement = document.getElementById("root");
if (!rootElement)
{
    throw new Error("Root element with id 'root' not found");
}

ReactDOM.createRoot(rootElement).render(
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
            <ToastProvider
                placement={"bottom-right"}
            />
            <MessageProvider>
                <AuthProvider>
                    <CartProvider>
                        <LayoutProvider>
                            <Routes>
                                <Route path="/" element={<Login/>}/>
                                <Route path="/login" element={<Login/>}/>
                                <Route path="/forgot-password" element={<ForgotPassword/>}/>
                                <Route path="/reset-password" element={<ResetPassword/>}/>
                                <Route path="/app/*" element={<ProtectedRoute><AppLayout/></ProtectedRoute>}/>
                            </Routes>
                        </LayoutProvider>
                    </CartProvider>
                </AuthProvider>
            </MessageProvider>
        </HeroUIProvider>
    );
}
