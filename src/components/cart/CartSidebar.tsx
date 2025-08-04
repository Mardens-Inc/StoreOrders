import React from "react";
import {useNavigate} from "react-router-dom";
import {Button, Card, CardBody, Chip, Divider, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useCart} from "../../providers/CartProvider";

const CartSidebar: React.FC = () =>
{
    const navigate = useNavigate();
    const {
        items,
        isOpen,
        setIsOpen,
        updateQuantity,
        removeFromCart,
        getTotalPrice,
        getTotalItems,
        clearCart
    } = useCart();

    const handleContinueShopping = () =>
    {
        setIsOpen(false);
        navigate("/app/categories");
    };

    const handleCheckout = () =>
    {
        // Navigate to checkout or create order
        console.log("Proceeding to checkout with items:", items);
        setIsOpen(false);
    };

    const handleClearCart = () =>
    {
        clearCart();
    };

    const handleClose = () =>
    {
        setIsOpen(false);
    };

    return (
        <Drawer
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            placement="right"
            size="md"
            backdrop={"blur"}
        >
            <DrawerContent>
                <>
                    <DrawerHeader className="flex flex-col gap-1">
                        <div className="flex items-center justify-between w-full">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Cart ({getTotalItems()})
                            </h2>
                            <Chip color="primary" variant="flat">
                                {items.length} item{items.length !== 1 ? "s" : ""}
                            </Chip>
                        </div>
                    </DrawerHeader>

                    <DrawerBody className="overflow-y-auto">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                                <div className="text-6xl mb-4">
                                    <Icon icon="lucide:shopping-cart" className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                                <p className="text-gray-500 mb-4">Add some products to get started!</p>
                                <Button
                                    color="primary"
                                    onPress={handleContinueShopping}
                                >
                                    Start Shopping
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                {items.map((item) => (
                                    <Card key={item.product.id} className="shadow-sm w-full">
                                        <CardBody className="flex flex-row gap-3 p-4">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Icon icon="lucide:package" className="w-6 h-6 text-gray-400"/>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm truncate">{item.product.name}</h4>
                                                <p className="text-xs text-gray-500 mb-2">
                                                    ${item.product.price.toFixed(2)} each
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-primary">
                                                      ${(item.product.price * item.quantity).toFixed(2)}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            isIconOnly
                                                            onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                        >
                                                            <Icon icon="lucide:minus" className="w-3 h-3"/>
                                                        </Button>
                                                        <span className="min-w-[2rem] text-center text-sm">
                                {item.quantity}
                              </span>
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            isIconOnly
                                                            onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                        >
                                                            <Icon icon="lucide:plus" className="w-3 h-3"/>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            color="danger"
                                                            variant="light"
                                                            isIconOnly
                                                            onPress={() => removeFromCart(item.product.id)}
                                                        >
                                                            <Icon icon="lucide:trash" className="w-4 h-4"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}

                                <Divider/>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Subtotal:</span>
                                        <span className="font-semibold">${getTotalPrice().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Tax (8.5%):</span>
                                        <span className="font-semibold">${(getTotalPrice() * 0.085).toFixed(2)}</span>
                                    </div>
                                    <Divider/>
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-bold">Total:</span>
                                        <span className="font-bold text-primary">
                                          ${(getTotalPrice() * 1.085).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DrawerBody>

                    <DrawerFooter className="flex gap-2">
                        {items.length > 0 && (
                            <>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={handleClearCart}
                                    className="flex-1"
                                >
                                    Clear Cart
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleCheckout}
                                    className="flex-2"
                                    disabled={items.length === 0}
                                >
                                    Checkout (${(getTotalPrice() * 1.085).toFixed(2)})
                                </Button>
                            </>
                        )}
                        <Button
                            color="default"
                            variant="light"
                            onPress={handleClose}
                            className={items.length === 0 ? "w-full" : ""}
                        >
                            {items.length === 0 ? "Continue Shopping" : "Close"}
                        </Button>
                    </DrawerFooter>
                </>
            </DrawerContent>
        </Drawer>
    );
};

export default CartSidebar;
