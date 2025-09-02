import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button, Card, CardBody, CardHeader, Chip} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useAuth} from "../../providers/AuthProvider";
import {useCart} from "../../providers/CartProvider";
import {ordersApi, productsApi} from "../../utils/api";

type QuickAction = {
    title: string;
    description: string;
    icon: string;
    color: "primary" | "success" | "secondary" | "warning" | "danger" | "default";
    action: () => void;
    badge?: string;
}

const Dashboard: React.FC = () =>
{
    document.title = "Dashboard - Store Orders";
    const navigate = useNavigate();
    const {user} = useAuth();
    const {getTotalItems} = useCart();
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        totalProducts: 0
    });

    useEffect(() =>
    {
        // Load dashboard stats
        const loadStats = async () =>
        {
            try
            {
                const [ordersResponse, productsResponse] = await Promise.all([
                    ordersApi.getOrders(),
                    productsApi.getProducts()
                ]);

                setStats({
                    totalOrders: ordersResponse.data?.length || 0,
                    pendingOrders: ordersResponse.data?.filter((order: any) => order.status === "pending").length || 0,
                    totalProducts: productsResponse.count || 0
                });
            } catch (error)
            {
                console.error("Failed to load dashboard stats:", error);
            }
        };

        loadStats();
    }, []);

    const getUserDisplayName = () =>
    {
        if (!user) return "User";
        const emailPart = user.email.split("@")[0];
        return emailPart.split(".").map(part =>
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(" ");
    };

    const quickActions: QuickAction[] = [
        {
            title: "Browse Categories",
            description: "Explore product categories and find what you need",
            icon: "lucide:grid-3x3",
            color: "primary" as const,
            action: () => navigate("/app/categories")
        },
        {
            title: "View Cart",
            description: `${getTotalItems()} items in your cart`,
            icon: "lucide:shopping-cart",
            color: "success" as const,
            action: () => navigate("/app/cart"),
            badge: getTotalItems() > 0 ? getTotalItems().toString() : undefined
        },
        {
            title: "Order History",
            description: "View your previous orders and reorder items",
            icon: "lucide:package",
            color: "secondary" as const,
            action: () => navigate("/app/orders")
        }
    ];

    // Add admin-specific actions
    if (user?.role === "admin")
    {
        quickActions.push({
            title: "Manage Inventory",
            description: "Add products and update stock levels",
            icon: "lucide:package-plus",
            color: "warning" as const,
            action: () => navigate("/app/admin/inventory")
        });
    }

    const statsCards = [
        {
            title: "Total Orders",
            value: stats.totalOrders,
            icon: "lucide:shopping-bag",
            color: "primary" as const
        },
        {
            title: "Pending Orders",
            value: stats.pendingOrders,
            icon: "lucide:clock",
            color: "warning" as const
        },
        {
            title: "Available Products",
            value: stats.totalProducts,
            icon: "lucide:package",
            color: "success" as const
        }
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Welcome Section */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {getUserDisplayName().split(" ")[0]}!
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                    {user?.role === "admin"
                        ? "Manage your store inventory and monitor orders across all locations."
                        : "Ready to place your next order? Browse our catalog and add items to your cart."
                    }
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Chip
                        color={user?.role === "admin" ? "danger" : "primary"}
                        variant="flat"
                        size="sm"
                    >
                        {user?.role === "admin" ? "Administrator" : "Store User"}
                    </Chip>
                    {user?.store_id && (
                        <Chip color="default" variant="flat" size="sm">
                            Store ID: {user.store_id}
                        </Chip>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {statsCards.map((stat, index) => (
                    <Card key={index} className="bg-gradient-to-r from-white to-gray-50">
                        <CardBody className="flex flex-row items-center gap-3 sm:gap-4 p-4 sm:p-6">
                            <div className={`p-2 sm:p-3 rounded-lg bg-${stat.color}-100 flex items-center justify-center flex-shrink-0`}>
                                <Icon icon={stat.icon} className={`w-5 h-5 sm:w-6 sm:h-6 text-${stat.color}-600`}/>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">{stat.title}</p>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {quickActions.map((action, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" isPressable>
                            <CardBody className="p-4 sm:p-6" onClick={action.action}>
                                <div className="flex items-start justify-between mb-3 sm:mb-4">
                                    <div className={`p-2 sm:p-3 rounded-lg bg-${action.color}-100 flex items-center justify-center flex-shrink-0`}>
                                        <Icon icon={action.icon} className={`w-5 h-5 sm:w-6 sm:h-6 text-${action.color}-600`}/>
                                    </div>
                                    {action.badge && (
                                        <Chip color={action.color} size="sm">
                                            {action.badge}
                                        </Chip>
                                    )}
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{action.title}</h3>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{action.description}</p>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Recent Activity or Admin Panel */}
            {user?.role === "admin" && (
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Admin Panel</h2>
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <h3 className="text-base sm:text-lg font-medium">System Management</h3>
                        </CardHeader>
                        <CardBody className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-6 pt-0">
                            <Button
                                color="primary"
                                variant="flat"
                                startContent={<Icon icon="lucide:users"/>}
                                onPress={() => navigate("/app/admin/user-management")}
                                className="w-full sm:w-auto min-h-[44px]"
                            >
                                Manage Users
                            </Button>
                            <Button
                                color="secondary"
                                variant="flat"
                                startContent={<Icon icon="lucide:package-plus"/>}
                                onPress={() => navigate("/app/admin/product-management")}
                                className="w-full sm:w-auto min-h-[44px]"
                            >
                                Add Products
                            </Button>
                            <Button
                                color="success"
                                variant="flat"
                                startContent={<Icon icon="lucide:bar-chart"/>}
                                onPress={() => navigate("/app/admin/reports")}
                                className="w-full sm:w-auto min-h-[44px]"
                            >
                                View Reports
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
