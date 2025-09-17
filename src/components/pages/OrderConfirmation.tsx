import React, {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Button, Card, CardBody, CardHeader, Chip, Divider, Link, Spinner} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useAuth} from "../../providers/AuthProvider";
import {ApiResponse, ordersApi, storesApi} from "../../utils/api";
import {StoreOption} from "../../utils/types.ts";

interface OrderItemVM
{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name: string;
    product_sku: string;
    product_image_url?: string | null;
}

interface OrderVM
{
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    notes?: string | null;
    created_at: string;
    items: OrderItemVM[];
}

const OrderConfirmation: React.FC = () =>
{
    document.title = "Order Confirmation - Store Orders";
    const {orderId} = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const {user} = useAuth();
    const [order, setOrder] = useState<OrderVM | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [store, setStore] = useState<StoreOption | null>(null);
    const role = user?.role; // "admin" | "store"
    useEffect(() =>
    {
        (async () =>
        {
            try
            {
                const resp = await storesApi.getStores();
                const data = (resp as ApiResponse).data as any[];
                const stores = (data || []).map(s => ({id: s.id, city: s.city ?? null, address: s.address ?? null}));
                if (user?.store_id) setStore(stores.find(i => i.id === user?.store_id) || null);
            } catch (e)
            {
                console.error("Failed to load stores", e);
            }
        })();
    }, [role, user?.store_id]);

    useEffect(() =>
    {
        let mounted = true;
        const load = async () =>
        {
            if (!orderId)
            {
                setError("Missing order ID");
                setLoading(false);
                return;
            }
            try
            {
                const resp: any = await ordersApi.getOrder(orderId);
                if (!resp || resp.success === false)
                {
                    throw new Error(resp?.error || "Failed to load order");
                }
                const raw = resp.data || resp;
                const ord = raw.order;
                const items = (raw.items || []).map((x: any) => ({
                    id: x.item?.id || x.id,
                    quantity: x.item?.quantity ?? x.quantity,
                    unit_price: x.item?.unit_price ?? x.unit_price ?? 0,
                    total_price: x.item?.total_price ?? x.total_price ?? (x.item?.unit_price ?? 0) * (x.item?.quantity ?? 0),
                    product_name: x.product_name,
                    product_sku: x.product_sku,
                    product_image_url: x.product_image_url ?? null
                }));
                const vm: OrderVM = {
                    id: ord?.id,
                    order_number: ord?.order_number || ord?.id,
                    status: ord?.status,
                    total_amount: ord?.total_amount ?? 0,
                    notes: ord?.notes ?? null,
                    created_at: ord?.created_at,
                    items
                };
                if (mounted) setOrder(vm);
            } catch (e: any)
            {
                if (mounted) setError(e?.message || "Failed to load order");
            } finally
            {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () =>
        {
            mounted = false;
        };
    }, [orderId]);

    const statusChip = useMemo(() =>
    {
        const s = order?.status || "Pending";
        const map: Record<string, { label: string; color: "warning" | "success" | "primary" | "danger" | "default" }> = {
            Pending: {label: "Pending", color: "warning"},
            Shipped: {label: "Shipped", color: "primary"},
            Delivered: {label: "Delivered", color: "success"}
        };
        return map[s] || map.Pending;
    }, [order?.status]);

    const totals = useMemo(() =>
    {
        if (!order) return {subtotal: 0, tax: 0, shipping: 0, total: 0};
        return {subtotal: order.total_amount, tax: 0, shipping: 0, total: order.total_amount};
    }, [order]);

    if (loading)
    {
        return (
            <div className="p-6 flex items-center justify-center h-[60vh]">
                <Spinner label="Loading order..."/>
            </div>
        );
    }

    if (error || !order)
    {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="lucide:alert-triangle" className="w-8 h-8 text-red-600"/>
                </div>
                <h1 className="text-2xl font-bold mb-2">Unable to load order</h1>
                <p className="text-gray-600 mb-6">{error || "Please try again later."}</p>
                <Button onPress={() => navigate("/app/orders")} color="primary">Go to Orders</Button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="lucide:check-circle" className="w-8 h-8 text-green-600"/>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
                <p className="text-gray-600">
                    Thank you for your order. We'll process it and notify you when it's ready.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Information */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-gray-900">Order Information</h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Order Number</p>
                                    <p className="font-semibold text-gray-900">{order.order_number || order.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Order Date</p>
                                    <p className="font-semibold text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <Chip color={statusChip.color} variant="flat" startContent={<Icon icon="lucide:clock" className="w-4 h-4"/>}>
                                        {statusChip.label}
                                    </Chip>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Estimated Delivery</p>
                                    <p className="font-semibold text-gray-900">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Ordered Items */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-gray-900">Ordered Items</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {order.items.map((i, index) => (
                                    <div key={i.id || index} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Icon icon="lucide:package" className="w-6 h-6 text-gray-400"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900">{i.product_name}</h3>
                                            <p className="text-sm text-gray-500">SKU: {i.product_sku}</p>
                                            <p className="text-sm text-gray-600">Quantity: {i.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">${(i.total_price ?? i.unit_price * i.quantity).toFixed(2)}</p>
                                            <p className="text-sm text-gray-500">${i.unit_price.toFixed(2)} each</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Delivery Information */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-gray-900">Delivery Information</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Store</p>
                                    <p className="font-semibold text-gray-900">{store?.city || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Requested By</p>
                                    <p className="font-semibold text-gray-900">{user?.email}</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex items-start space-x-2">
                                        <Icon icon="lucide:info" className="w-5 h-5 text-blue-600 mt-0.5"/>
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">What happens next?</p>
                                            <p className="text-sm text-blue-700">
                                                Your order will be reviewed by the warehouse team and prepared for delivery to your store location.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal ({order.items.reduce((total, item) => total + item.quantity, 0)} items)</span>
                                    <span>${totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Shipping</span>
                                    <span className="text-green-600">Free</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Tax</span>
                                    <span>${totals.tax.toFixed(2)}</span>
                                </div>
                                <Divider/>
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>${totals.total.toFixed(2)}</span>
                                </div>
                            </div>

                            <Divider/>

                            <div className="space-y-3">
                                <Button
                                    as={Link}
                                    color="primary"
                                    size="lg"
                                    className="w-full"
                                    href={"/app/orders"}
                                    startContent={<Icon icon="lucide:package" className="w-4 h-4"/>}
                                >
                                    View Order History
                                </Button>
                                <Button
                                    as={Link}
                                    variant="bordered"
                                    size="lg"
                                    className="w-full"
                                    href={"/app/categories"}
                                    startContent={<Icon icon="lucide:shopping-bag" className="w-4 h-4"/>}

                                >
                                    Continue Shopping
                                </Button>
                                <Button
                                    as={Link}
                                    variant="light"
                                    size="sm"
                                    className="w-full"
                                    startContent={<Icon icon="lucide:home" className="w-4 h-4"/>}
                                    href={"/app"}
                                >
                                    Back to Dashboard
                                </Button>
                            </div>

                            <Divider/>

                            <div className="text-center">
                                <p className="text-xs text-gray-500 mb-2">Need help with your order?</p>
                                <Button
                                    as={Link}
                                    href={`mailto:helpdesk@mardens.com?subject=Store Ordering Portal Support Request&body=${encodeURIComponent(
                                        `Please provide the following information:
                                    1. Store Location: ${store?.city}
                                    2. Issue Description:
                                    3. Steps to Reproduce:
                                    4. Expected Behavior:
                                    5. Additional Notes:
                                    
                                    --- System Information ---
                                    Browser: ${navigator.userAgent}
                                    Time of Report: ${new Date().toLocaleString()} 
                                    `
                                    )}`}
                                    size="sm"
                                    variant="flat"
                                    color="secondary"
                                    startContent={<Icon icon="lucide:help-circle" className="w-4 h-4"/>}
                                >
                                    Contact Support
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
