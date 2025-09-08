import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button, Card, CardBody, CardHeader, Chip, Divider, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useCart} from "../../providers/CartProvider";
import {useAuth} from "../../providers/AuthProvider";
import {ordersApi} from "../../utils/api";
import {Input} from "../extension/Input.tsx";

const Cart: React.FC = () =>
{
    document.title = "Cart - Store Orders";
    const navigate = useNavigate();
    const {items, updateQuantity, removeFromCart, getTotalPrice, clearCart} = useCart();
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [orderNotes, setOrderNotes] = useState("");
    const {user} = useAuth();
    const [isPlacing, setIsPlacing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleQuantityChange = (productId: string, newQuantity: number) =>
    {
        if (newQuantity >= 1)
        {
            updateQuantity(productId, newQuantity);
        }
    };

    const placeOrder = async () =>
    {
        setErrorMsg(null);
        if (!user?.store_id)
        {
            setErrorMsg("Missing store. Please sign in as a store user.");
            return;
        }
        if (items.length === 0)
        {
            setErrorMsg("Your cart is empty.");
            return;
        }

        setIsPlacing(true);
        try
        {
            const payload = {
                store_id: user.store_id,
                items: items.map(i => ({product_id: i.product.id, quantity: i.quantity})),
                notes: orderNotes || undefined
            };
            const resp = await ordersApi.createOrder(payload);
            if (!resp || (resp as any).success === false)
            {
                throw new Error((resp as any)?.error || "Failed to create order");
            }
            const data: any = (resp as any).data || resp; // ApiResponse vs direct
            const orderId = data?.id || data?.order?.id;
            if (!orderId) throw new Error("Order ID missing in response");
            clearCart();
            navigate(`/app/order-confirmation/${orderId}`);
        } catch (e: any)
        {
            console.error("Create order failed:", e);
            setErrorMsg(e?.message || "Failed to place order");
        } finally
        {
            setIsPlacing(false);
        }
    };

    if (items.length === 0)
    {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <Icon icon="lucide:shopping-cart" className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-600 mb-6">Add some products to get started</p>
                    <Button
                        color="primary"
                        onPress={() => navigate("/app/categories")}
                        startContent={<Icon icon="lucide:shopping-bag" className="w-4 h-4"/>}
                    >
                        Browse Products
                    </Button>
                </div>
            </div>
        );
    }

    console.log("Cart Items: ", items);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
                <p className="text-gray-600">{items.length} item{items.length !== 1 ? "s" : ""} in your cart</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <Card key={item.product.id}>
                            <CardBody className="p-4">
                                <div className="flex items-center space-x-4">
                                    {/* Product Image */}
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Icon icon="lucide:package" className="w-8 h-8 text-gray-400"/>
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {item.product.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-1">SKU: {item.product.sku}</p>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {item.product.description}
                                        </p>
                                        <div className="flex items-center mt-2">
                                            <Chip size="sm" color="success" variant="flat">
                                                In Stock
                                            </Chip>
                                        </div>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="bordered"
                                            onPress={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                                        >
                                            <Icon icon="lucide:minus" className="w-4 h-4"/>
                                        </Button>
                                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="bordered"
                                            onPress={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                                        >
                                            <Icon icon="lucide:plus" className="w-4 h-4"/>
                                        </Button>
                                    </div>

                                    {/* Price and Remove */}
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-gray-900">
                                            ${(item.product.price * item.quantity).toFixed(2)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            ${item.product.price.toFixed(2)} each
                                        </p>
                                        <Button
                                            size="sm"
                                            color="danger"
                                            variant="light"
                                            className="mt-2"
                                            onPress={() => removeFromCart(item.product.id)}
                                            startContent={<Icon icon="lucide:trash-2" className="w-4 h-4"/>}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {/* Order Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Special Instructions (Optional)
                                </label>
                                <Input
                                    placeholder="Add any special notes for this order..."
                                    value={orderNotes}
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                    variant="bordered"
                                />
                                {errorMsg && (
                                    <p className="text-sm text-danger mt-2">{errorMsg}</p>
                                )}
                            </div>

                            <Divider/>

                            {/* Price Breakdown */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal ({items.reduce((total, item) => total + item.quantity, 0)} items)</span>
                                    <span>${getTotalPrice().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Shipping</span>
                                    <span className="text-green-600">Free</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Tax</span>
                                    <span>$0.00</span>
                                </div>
                                <Divider/>
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>${getTotalPrice().toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <Button
                                    color="primary"
                                    size="lg"
                                    className="w-full"
                                    isDisabled={isPlacing}
                                    onPress={onOpen}
                                >
                                    {isPlacing ? "Placing..." : "Place Order"}
                                </Button>
                                <Button
                                    variant="bordered"
                                    size="lg"
                                    className="w-full"
                                    onPress={() => navigate("/app/categories")}
                                >
                                    Continue Shopping
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Confirm Your Order
                            </ModalHeader>
                            <ModalBody>
                                <p>Are you sure you want to place this order?</p>
                                <div className="bg-gray-50 p-3 rounded-lg mt-3">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Items:</span>
                                        <span>{items.reduce((total, item) => total + item.quantity, 0)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span>Total:</span>
                                        <span>${getTotalPrice().toFixed(2)}</span>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose} isDisabled={isPlacing}>
                                    Cancel
                                </Button>
                                <Button color="primary" isDisabled={isPlacing} onPress={async () =>
                                {
                                    await placeOrder();
                                    onClose();
                                }}>
                                    {isPlacing ? "Placing..." : "Confirm Order"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};

export default Cart;
