import React, {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Button, Card, Divider} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useAuth} from "../../providers/AuthProvider";
import {useLayout} from "../../providers/LayoutProvider";

const Sidebar: React.FC = () =>
{
    const [applicationVersion, setApplicationVersion] = useState("");
    const location = useLocation();
    const navigate = useNavigate();
    const {user} = useAuth();
    const {setIsMobileMenuOpen, isMobile} = useLayout();

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

    const handleNavigation = (path: string) => {
        navigate(path);
        // Close mobile menu after navigation
        if (isMobile) {
            setIsMobileMenuOpen(false);
        }
    };

    useEffect(() =>
    {
        fetch("/api/version")
            .then(response => response.text())
            .then(setApplicationVersion);
    }, []);

    return (
        <Card className={`
            w-64 h-full rounded-none border-r shadow-sm relative
            ${isMobile ? 'shadow-lg' : 'shadow-sm'}
        `}>
            <div className="p-4 sm:p-6 relative flex flex-col h-full">
                {/* Logo Section */}
                <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-base sm:text-lg">M</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">Mardens</h1>
                        <p className="text-xs text-gray-500">Store Portal</p>
                    </div>
                </div>

                <Divider className="my-3 sm:my-4"/>

                {/* Navigation */}
                <nav className="space-y-1 sm:space-y-2 flex-1">
                    {navigationItems.map((item) => (
                        <Button
                            key={item.id}
                            variant={isActiveRoute(item.path) ? "solid" : "light"}
                            color={isActiveRoute(item.path) ? "primary" : "default"}
                            className="w-full justify-start h-10 sm:h-12 text-sm sm:text-base"
                            startContent={
                                <Icon
                                    icon={item.icon}
                                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                                />
                            }
                            onPress={() => handleNavigation(item.path)}
                        >
                            <span className="ml-2 sm:ml-3 text-left truncate">{item.label}</span>
                        </Button>
                    ))}

                    {/* Render admin navigation items if user is admin */}
                    {user?.role === "admin" ? adminNavigationItems.map((item) => (
                        <Button
                            key={item.id}
                            variant={isActiveRoute(item.path) ? "solid" : "light"}
                            color={isActiveRoute(item.path) ? "primary" : "default"}
                            className="w-full justify-start h-10 sm:h-12 text-sm sm:text-base"
                            startContent={
                                <Icon
                                    icon={item.icon}
                                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                                />
                            }
                            onPress={() => handleNavigation(item.path)}
                        >
                            <span className="ml-2 sm:ml-3 text-left truncate">{item.label}</span>
                        </Button>
                    )) : user?.role === "store" ? storeNavigationItems.map((item) => (
                        <Button
                            key={item.id}
                            variant={isActiveRoute(item.path) ? "solid" : "light"}
                            color={isActiveRoute(item.path) ? "primary" : "default"}
                            className="w-full justify-start h-10 sm:h-12 text-sm sm:text-base"
                            startContent={
                                <Icon
                                    icon={item.icon}
                                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                                />
                            }
                            onPress={() => handleNavigation(item.path)}
                        >
                            <span className="ml-2 sm:ml-3 text-left truncate">{item.label}</span>
                        </Button>
                    )) : null}
                </nav>

                {/* Version Display */}
                <div className="mt-auto pt-3 sm:pt-4">
                    <p className="text-tiny opacity-40 font-bold italic text-center w-full truncate">
                        {applicationVersion}
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default Sidebar;
