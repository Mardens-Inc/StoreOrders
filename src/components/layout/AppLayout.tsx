import React from "react";
import {Navigate, Route, Routes} from "react-router-dom";
import {useAuth} from "../../providers/AuthProvider";
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

const AppLayout: React.FC = () =>
{
    const {isAuthenticated} = useAuth();

    if (!isAuthenticated)
    {
        return <Navigate to="/" replace/>;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar/>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header/>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <Routes>
                        <Route path="/" element={<Dashboard/>}/>
                        <Route path="/categories" element={<Categories/>}/>
                        <Route path="/categories/:categoryId/products" element={<Products/>}/>
                        <Route path="/cart" element={<Cart/>}/>
                        <Route path="/orders" element={<Orders/>}/>
                        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation/>}/>
                        <Route path="/admin/user-management" element={<UserManagement/>}/>
                        <Route path="/admin/product-management" element={<ProductManagement/>}/>
                    </Routes>
                </main>
            </div>

            {/* Cart Sidebar */}
            <CartSidebar/>
        </div>
    );
};

export default AppLayout;
