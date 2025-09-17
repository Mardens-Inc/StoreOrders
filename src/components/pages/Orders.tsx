import React, {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button, Card, CardBody, CardHeader, Chip, Select, SelectItem, Spinner} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {ApiResponse, ordersApi, storesApi} from "../../utils/api";
import {useAuth} from "../../providers/AuthProvider";
import {ErrorBoundary} from "../ErrorBoundary.tsx";
import {OrderItemWithProductDto, OrderWithItemsDto, StoreOption, StoreOrderRecordDto} from "../../utils/types";
import {Input} from "../extension/Input.tsx";

// Backend shapes removed in favor of shared DTOs

const Orders: React.FC = () =>
{
    document.title = "Orders - Store Orders";
    const navigate = useNavigate();
    const {user} = useAuth();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<StoreOrderRecordDto[]>([]);
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [selectedStore, setSelectedStore] = useState<string | null>(null);

    const storeOptions = useMemo(() => [{id: "__all", city: "All Stores", address: null as any}, ...stores], [stores]);

    const [details, setDetails] = useState<Record<string, OrderWithItemsDto | undefined>>({});
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    const role = user?.role; // "admin" | "store"


    // Fetch stores for admin filter
    useEffect(() =>
    {
        (async () =>
        {
            try
            {
                const resp = await storesApi.getStores();
                const data = (resp as ApiResponse).data as any[];
                setStores((data || []).map(s => ({id: s.id, city: s.city ?? null, address: s.address ?? null})));
            } catch (e)
            {
                console.error("Failed to load stores", e);
            }
        })();
        if (role === "store")
        {
            // For store users, lock selectedStore to their own store_id
            if (user?.store_id) setSelectedStore(user.store_id);
        }
    }, [role, user?.store_id]);

    // Fetch orders based on role and selected store
    const fetchOrders = async (storeId?: string) =>
    {
        setLoading(true);
        try
        {
            let resp: ApiResponse;
            console.log("Getting orders for role: ", role, " storeId: ", storeId, " user: ", user);
            if (role === "admin")
            {
                if (!storeId)
                {
                    resp = await ordersApi.getOrders();
                } else
                {
                    resp = await ordersApi.getStoreOrders(storeId);
                }
            } else if (role === "store")
            {
                if (!user?.store_id)
                {
                    setOrders([]);
                    return;
                }
                resp = await ordersApi.getStoreOrders(user.store_id);
            } else
            {
                // Fallback: personal orders
                resp = await ordersApi.getOrders();
            }
            const data = (resp as ApiResponse).data as StoreOrderRecordDto[];
            setOrders(data || []);
        } catch (e)
        {
            console.error("Failed to load orders", e);
            setOrders([]);
        } finally
        {
            setLoading(false);
        }
    };

    useEffect(() =>
    {
        if (role === "admin")
        {
            // Always fetch; if no selectedStore, backend returns all orders
            fetchOrders(selectedStore || undefined);
        } else
        {
            fetchOrders();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, selectedStore]);

    const getStatusColor = (status: string) =>
    {
        const s = status.toLowerCase();
        switch (s)
        {
            case "pending":
                return "warning";
            case "shipped":
                return "primary";
            case "delivered":
                return "success";
            default:
                return "default";
        }
    };

    const getStatusIcon = (status: string) =>
    {
        const s = status.toLowerCase();
        switch (s)
        {
            case "pending":
                return "lucide:clock";
            case "shipped":
                return "lucide:truck";
            case "delivered":
                return "lucide:package-check";
            default:
                return "lucide:circle";
        }
    };

    const filteredOrders = useMemo(() =>
    {
        return (orders || []).filter(order =>
        {
            const matchesSearch = (order.order_number || "").toLowerCase().includes(searchTerm.toLowerCase())
                || (order.notes || "").toLowerCase().includes(searchTerm.toLowerCase());
            const s = order.status?.toLowerCase?.() || "";
            const matchesStatus = statusFilter === "all" || s === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    const toggleDetails = async (orderId: string) =>
    {
        if (details[orderId])
        {
            // collapse
            setDetails(prev => ({...prev, [orderId]: undefined}));
            return;
        }
        try
        {
            const resp = await ordersApi.getOrder(orderId);
            const data = (resp as ApiResponse).data as OrderWithItemsDto;
            setDetails(prev => ({...prev, [orderId]: data}));
        } catch (e)
        {
            console.error("Failed to load order details", e);
        }
    };

    const updateStatus = async (order: StoreOrderRecordDto, status: "Shipped" | "Delivered") =>
    {
        setUpdating(prev => ({...prev, [order.id]: true}));
        try
        {
            await ordersApi.updateOrderStatus(order.id, status);
            // Refresh orders list and details
            await fetchOrders(selectedStore || undefined);
            if (details[order.id])
            {
                const resp = await ordersApi.getOrder(order.id);
                const data = (resp as ApiResponse).data as OrderWithItemsDto;
                setDetails(prev => ({...prev, [order.id]: data}));
            }
        } catch (e)
        {
            console.error("Failed to update order status", e);
        } finally
        {
            setUpdating(prev => ({...prev, [order.id]: false}));
        }
    };

    const canAdminSetShippedOrDelivered = (order: StoreOrderRecordDto) =>
    {
        const s = order.status.toLowerCase();
        return role === "admin" && s === "pending";
    };

    const openPrintManifestWindow = (order: StoreOrderRecordDto) =>
    {
        const url = `${window.location.origin}/api/orders/${order.id}/manifest`;
        const newWindow = window.open(url, "_blank", "toolbar=no,scrollbars=no,resizable=no,width=1020,height=667");
        newWindow?.focus();
        if (newWindow)
        {
            newWindow.onload = () =>
            {
                newWindow.print();
                newWindow.close();
            };
        }
    };


    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
                <p className="text-gray-600">View and track your previous orders</p>
            </div>

            {/* Filters */}
            <ErrorBoundary>
                <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch sm:items-end">
                    <Input
                        label={"Search orders"}
                        placeholder="Search by order number or notes, ex: #12345, shipped, "
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400"/>}
                        variant="bordered"
                        className="w-full sm:w-80"
                        classNames={{input: "text-sm", inputWrapper: "bg-white"}}
                        size={"sm"}
                    />
                    <Select
                        label={"Filter by status"}
                        selectedKeys={[statusFilter]}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        variant="bordered"
                        className="w-full sm:w-48"
                        classNames={{trigger: "bg-white"}}
                        size={"sm"}
                    >
                        <SelectItem key="all" textValue="all">All Orders</SelectItem>
                        <SelectItem key="pending" textValue="pending">Pending</SelectItem>
                        <SelectItem key="shipped" textValue="shipped">Shipped</SelectItem>
                        <SelectItem key="delivered" textValue="delivered">Delivered</SelectItem>
                    </Select>

                    {role === "admin" && (
                        <Select
                            label="Filter by Store"
                            selectedKeys={selectedStore ? [selectedStore] : ["__all"]}
                            onSelectionChange={(keys) =>
                            {
                                const key = Array.from(keys)[0] as string;
                                setSelectedStore(key === "__all" ? null : key);
                            }}
                            variant="bordered"
                            className="w-full sm:w-72"
                            classNames={{trigger: "bg-white"}}
                            size={"sm"}
                        >
                            {storeOptions.map(s => (
                                <SelectItem key={s.id}>
                                    {s.city || s.address || s.id}
                                </SelectItem>
                            ))}
                        </Select>
                    )}
                </div>
            </ErrorBoundary>

            {/* Loader */}
            {loading && (
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <Spinner size="sm"/> Loading orders...
                </div>
            )}

            <ErrorBoundary>
                {/* Orders List */}
                <div className="space-y-4">
                    {!loading && filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <Icon icon="lucide:package-x" className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                            <p className="text-gray-600 mb-6">No orders match your filters</p>
                            <Button
                                color="primary"
                                onPress={() => navigate("/app/categories")}
                                startContent={<Icon icon="lucide:shopping-bag" className="w-4 h-4"/>}
                            >
                                Start Shopping
                            </Button>
                        </div>
                    ) : (
                        filteredOrders.map((order) =>
                        {
                            const detailsLoaded = !!details[order.id];
                            const items: OrderItemWithProductDto[] = details[order.id]?.items || [];
                            const totalItems = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
                            return (
                                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start w-full">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{order.order_number}</h3>
                                                <p className="text-sm text-gray-500">
                                                    Ordered on {new Date(order.created_at).toLocaleDateString()} by {stores.find(s => s.id === order.store_id)?.city || "Unknown Store"}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Notes: {order.notes || "No notes"}
                                                </p>
                                            </div>
                                            <Chip
                                                color={getStatusColor(order.status) as any}
                                                variant="flat"
                                                startContent={<Icon icon={getStatusIcon(order.status)} className="w-4 h-4"/>}
                                            >
                                                {order.status}
                                            </Chip>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Order Summary */}
                                            <div className="lg:col-span-2">
                                                <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                                                {detailsLoaded ? (
                                                    <div className="space-y-2">
                                                        {items.map((it, index) => (
                                                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                                                <div>
                                                                    <p className="font-medium text-sm text-gray-900">{it.product_name}</p>
                                                                    <p className="text-xs text-gray-500">Quantity: {it.quantity}</p>
                                                                </div>
                                                                <p className="font-medium text-sm">${(it.total_price).toFixed(2)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500">Details not loaded.</div>
                                                )}
                                            </div>

                                            {/* Order Total and Actions */}
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-600">Items:</span>
                                                        <span className="text-sm font-medium">{detailsLoaded ? totalItems : "-"}</span>
                                                    </div>
                                                    <div className="flex justify-between text-lg font-bold">
                                                        <span>Total:</span>
                                                        <span>${Number(order.total_amount || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="space-y-2 pt-2">
                                                        <Button
                                                            variant="bordered"
                                                            size="sm"
                                                            className="w-full"
                                                            startContent={<Icon icon="lucide:eye" className="w-4 h-4"/>}
                                                            onPress={() => toggleDetails(order.id)}
                                                        >
                                                            {detailsLoaded ? "Hide Details" : "View Details"}
                                                        </Button>
                                                        <div className="flex gap-2">
                                                            {role === "admin" && canAdminSetShippedOrDelivered(order) && (
                                                                <Button
                                                                    color="secondary"
                                                                    size="sm"
                                                                    className="flex-1"
                                                                    isDisabled={!!updating[order.id]}
                                                                    onPress={() => updateStatus(order, "Shipped")}
                                                                    startContent={<Icon icon="lucide:truck" className="w-4 h-4"/>}
                                                                >
                                                                    Mark Shipped
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                className="flex-1"
                                                                onPress={() => openPrintManifestWindow(order)}
                                                                startContent={<Icon icon="lucide:printer" className="w-4 h-4"/>}
                                                            >
                                                                Print Manifest
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        })
                    )}
                </div>
            </ErrorBoundary>
        </div>
    );
};

export default Orders;
