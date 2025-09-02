import React, {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Button, Card, Divider} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useAuth} from "../../providers/AuthProvider";

const Sidebar: React.FC = () =>
{
    const [applicationVersion, setApplicationVersion] = useState("");
    const location = useLocation();
    const navigate = useNavigate();
    const {user} = useAuth();

    const navigationItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: "lucide:home",
            path: "/app"
        },
        {
            id: "categories",
            label: "Browse Categories",
            icon: "lucide:grid-3x3",
            path: "/app/categories"
        },
        {
            id: "orders",
            label: "Order History",
            icon: "lucide:package",
            path: "/app/orders"
        }
    ];

    const storeNavigationItems = [
        {
            id: "cart",
            label: "My Cart",
            icon: "lucide:shopping-cart",
            path: "/app/cart"
        }];

    // Admin-only navigation items
    const adminNavigationItems = [
        {
            id: "user-management",
            label: "User Management",
            icon: "lucide:users",
            path: "/app/admin/user-management"
        },
        {
            id: "product-management",
            label: "Product Management",
            icon: "lucide:package",
            path: "/app/admin/product-management"
        }
    ];

    const isActiveRoute = (path: string) =>
    {
        if (path === "/app")
        {
            return location.pathname === "/app" || location.pathname === "/app/";
        }
        return location.pathname.startsWith(path);
    };

    useEffect(() =>
    {
        fetch("/api/version")
            .then(response => response.text())
            .then(setApplicationVersion);
    }, []);

    return (
        <Card className="w-64 h-full rounded-none border-r shadow-sm relative">
            <div className="p-6 relative">
                {/* Logo Section */}
                <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Mardens</h1>
                        <p className="text-xs text-gray-500">Store Portal</p>
                    </div>
                </div>

                <Divider className="my-4"/>

                {/* Navigation */}
                <nav className="space-y-2">
                    {navigationItems.map((item) => (
                        <Button
                            key={item.id}
                            variant={isActiveRoute(item.path) ? "solid" : "light"}
                            color={isActiveRoute(item.path) ? "primary" : "default"}
                            className="w-full justify-start h-12"
                            startContent={
                                <Icon
                                    icon={item.icon}
                                    className="w-5 h-5"
                                />
                            }
                            onPress={() => navigate(item.path)}
                        >
                            <span className="ml-3 text-left">{item.label}</span>
                        </Button>
                    ))}
                    {/* Render admin navigation items if user is admin */}
                    {user?.role === "admin" ? adminNavigationItems.map((item) => (
                        <Button
                            key={item.id}
                            variant={isActiveRoute(item.path) ? "solid" : "light"}
                            color={isActiveRoute(item.path) ? "primary" : "default"}
                            className="w-full justify-start h-12"
                            startContent={
                                <Icon
                                    icon={item.icon}
                                    className="w-5 h-5"
                                />
                            }
                            onPress={() => navigate(item.path)}
                        >
                            <span className="ml-3 text-left">{item.label}</span>
                        </Button>
                    )) : user?.role === "store" ? storeNavigationItems.map((item) => (
                        <Button
                            key={item.id}
                            variant={isActiveRoute(item.path) ? "solid" : "light"}
                            color={isActiveRoute(item.path) ? "primary" : "default"}
                            className="w-full justify-start h-12"
                            startContent={
                                <Icon
                                    icon={item.icon}
                                    className="w-5 h-5"
                                />
                            }
                            onPress={() => navigate(item.path)}
                        >
                            <span className="ml-3 text-left">{item.label}</span>
                        </Button>
                    )) : null}
                </nav>
            </div>
            <p className={"text-tiny opacity-40 font-bold italic mt-auto mb-2 text-center w-full"}>{applicationVersion}</p>
        </Card>
    );
};

export default Sidebar;
