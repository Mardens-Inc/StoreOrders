import React, {useEffect} from "react";
import {Route, Routes, useNavigate} from "react-router-dom";
import {useAuth} from "../../providers/AuthProvider";
import {useLayout} from "../../providers/LayoutProvider";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Dashboard from "../pages/Dashboard";
import Categories from "../pages/Categories";
import Products from "../pages/Products";
import Cart from "../pages/Cart";
import Orders from "../pages/Orders";
import OrderConfirmation from "../pages/OrderConfirmation";
import UserManagement from "../pages/UserManagement";
import ProductManagement from "../pages/ProductManagement";
import CartSidebar from "../cart/CartSidebar";
import RequireRole from "../routing/RequireRole";

const AppLayout: React.FC = () =>
{
    const {isAuthenticated} = useAuth();
    const {isMobileMenuOpen, setIsMobileMenuOpen, isMobile} = useLayout();
    const navigate = useNavigate();

    useEffect(() =>
    {
        if (isAuthenticated === undefined) return;
        if (!isAuthenticated) navigate("/");
    }, [isAuthenticated]);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Mobile Overlay */}
            {isMobile && isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                ${isMobile ? 'fixed' : 'relative'} 
                z-50 h-full transition-transform duration-300 ease-in-out
                ${isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
                lg:translate-x-0 lg:static lg:z-auto
            `}>
                <Sidebar/>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Header */}
                <Header/>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="h-full">
                        <Routes>
                            <Route path="/" element={<Dashboard/>}/>
                            <Route path="/categories" element={<Categories/>}/>
                            <Route path="/categories/:categoryId/products" element={<Products/>}/>
                            <Route path="/cart" element={<Cart/>}/>
                            <Route path="/orders" element={<Orders/>}/>
                            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation/>}/>
                            <Route path="/admin/user-management" element={<RequireRole role="admin"><UserManagement/></RequireRole>}/>
                            <Route path="/admin/product-management" element={<RequireRole role="admin"><ProductManagement/></RequireRole>}/>
                        </Routes>
                    </div>
                </main>
            </div>

            {/* Cart Sidebar */}
            <CartSidebar/>
        </div>
    );
};

export default AppLayout;
