import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button, Card, CardBody, CardHeader, Chip, Input, Select, SelectItem} from "@heroui/react";
import {Icon} from "@iconify-icon/react";

interface Order
{
    id: string;
    date: string;
    status: "pending" | "approved" | "shipped" | "delivered" | "cancelled";
    total: number;
    itemCount: number;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
}

const Orders: React.FC = () =>
{
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Mock orders data
    const mockOrders: Order[] = [
        {
            id: "ORD-2024-001",
            date: "2024-01-15",
            status: "delivered",
            total: 156.43,
            itemCount: 8,
            items: [
                {name: "Premium Ballpoint Pens (Pack of 12)", quantity: 2, price: 8.99},
                {name: "Copy Paper (500 sheets)", quantity: 3, price: 12.49},
                {name: "File Folders (25 pack)", quantity: 1, price: 15.99}
            ]
        },
        {
            id: "ORD-2024-002",
            date: "2024-01-18",
            status: "shipped",
            total: 89.97,
            itemCount: 5,
            items: [
                {name: "Desktop Stapler", quantity: 1, price: 24.99},
                {name: "Sticky Notes Variety Pack", quantity: 3, price: 6.75}
            ]
        },
        {
            id: "ORD-2024-003",
            date: "2024-01-20",
            status: "pending",
            total: 45.23,
            itemCount: 3,
            items: [
                {name: "Highlighter Set (4 colors)", quantity: 2, price: 9.49}
            ]
        }
    ];

    const getStatusColor = (status: string) =>
    {
        switch (status)
        {
            case "pending":
                return "warning";
            case "approved":
                return "primary";
            case "shipped":
                return "secondary";
            case "delivered":
                return "success";
            case "cancelled":
                return "danger";
            default:
                return "default";
        }
    };

    const getStatusIcon = (status: string) =>
    {
        switch (status)
        {
            case "pending":
                return "lucide:clock";
            case "approved":
                return "lucide:check-circle";
            case "shipped":
                return "lucide:truck";
            case "delivered":
                return "lucide:package-check";
            case "cancelled":
                return "lucide:x-circle";
            default:
                return "lucide:circle";
        }
    };

    const filteredOrders = mockOrders.filter(order =>
    {
        const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
                <p className="text-gray-600">View and track your previous orders</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400"/>}
                    variant="bordered"
                    className="w-full sm:w-80"
                    classNames={{
                        input: "text-sm",
                        inputWrapper: "bg-white"
                    }}
                />
                <Select
                    placeholder="Filter by status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    variant="bordered"
                    className="w-full sm:w-48"
                    classNames={{
                        trigger: "bg-white"
                    }}
                >
                    <SelectItem key="all" textValue="all">All Orders</SelectItem>
                    <SelectItem key="pending" textValue="pending">Pending</SelectItem>
                    <SelectItem key="approved" textValue="approved">Approved</SelectItem>
                    <SelectItem key="shipped" textValue="shipped">Shipped</SelectItem>
                    <SelectItem key="delivered" textValue="delivered">Delivered</SelectItem>
                    <SelectItem key="cancelled" textValue="cancelled">Cancelled</SelectItem>
                </Select>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <Icon icon="lucide:package-x" className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                        <p className="text-gray-600 mb-6">You haven't placed any orders yet or no orders match your search</p>
                        <Button
                            color="primary"
                            onPress={() => navigate("/app/categories")}
                            startContent={<Icon icon="lucide:shopping-bag" className="w-4 h-4"/>}
                        >
                            Start Shopping
                        </Button>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <Card key={order.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start w-full">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{order.id}</h3>
                                        <p className="text-sm text-gray-500">
                                            Ordered on {new Date(order.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Chip
                                        color={getStatusColor(order.status) as any}
                                        variant="flat"
                                        startContent={<Icon icon={getStatusIcon(order.status)} className="w-4 h-4"/>}
                                    >
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </Chip>
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Order Summary */}
                                    <div className="lg:col-span-2">
                                        <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                                        <div className="space-y-2">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-900">{item.name}</p>
                                                        <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Total and Actions */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Items:</span>
                                                <span className="text-sm font-medium">{order.itemCount}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold">
                                                <span>Total:</span>
                                                <span>${order.total.toFixed(2)}</span>
                                            </div>
                                            <div className="space-y-2 pt-2">
                                                <Button
                                                    variant="bordered"
                                                    size="sm"
                                                    className="w-full"
                                                    startContent={<Icon icon="lucide:eye" className="w-4 h-4"/>}
                                                >
                                                    View Details
                                                </Button>
                                                {order.status === "delivered" && (
                                                    <Button
                                                        color="primary"
                                                        size="sm"
                                                        className="w-full"
                                                        startContent={<Icon icon="lucide:repeat" className="w-4 h-4"/>}
                                                    >
                                                        Reorder
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default Orders;
