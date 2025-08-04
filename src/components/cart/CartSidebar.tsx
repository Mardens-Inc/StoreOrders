import React from "react";
import {useNavigate} from "react-router-dom";
import {Button, Card, CardBody, Divider, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, ScrollShadow} from "@heroui/react";
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
        getTotalItems
    } = useCart();

    const handleViewCart = () =>
    {
        setIsOpen(false);
        navigate("/app/cart");
    };

    const handleContinueShopping = () =>
    {
        setIsOpen(false);
        navigate("/app/categories");
    };

    return (
        <Drawer
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            placement="right"
            size="md"
        >
            <DrawerContent>
                <>
                    <DrawerHeader className="flex flex-col gap-1">
                        <div className="flex items-center justify-between w-full">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Cart ({getTotalItems()})
                            </h2>
                        </div>
                    </DrawerHeader>

                    <DrawerBody className="p-0">
                        {items.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <Icon icon="lucide:shopping-cart" className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                                <p className="text-gray-600 mb-4">Your cart is empty</p>
                                <Button
                                    color="primary"
                                    onPress={handleContinueShopping}
                                >
                                    Start Shopping
                                </Button>
                            </div>
                        ) : (
                            <ScrollShadow className="h-full px-4">
                                <div className="space-y-4 py-4">
                                    {items.map((item) => (
                                        <Card key={item.product.id} className="shadow-sm">
                                            <CardBody className="p-3">
                                                <div className="flex items-start space-x-3">
                                                    {/* Product Image */}
                                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Icon icon="lucide:package" className="w-6 h-6 text-gray-400"/>
                                                    </div>

                                                    {/* Product Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                                                            {item.product.name}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mb-2">
                                                            ${item.product.price.toFixed(2)} each
                                                        </p>

                                                        {/* Quantity Controls */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <Button
                                                                    isIconOnly
                                                                    size="sm"
                                                                    variant="bordered"
                                                                    className="w-6 h-6 min-w-6"
                                                                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                                >
                                                                    <Icon icon="lucide:minus" className="w-3 h-3"/>
                                                                </Button>
                                                                <span className="text-sm font-medium w-8 text-center">
                                    {item.quantity}
                                  </span>
                                                                <Button
                                                                    isIconOnly
                                                                    size="sm"
                                                                    variant="bordered"
                                                                    className="w-6 h-6 min-w-6"
                                                                    onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                                >
                                                                    <Icon icon="lucide:plus" className="w-3 h-3"/>
                                                                </Button>
                                                            </div>

                                                            <div className="text-right">
                                                                <p className="font-medium text-sm">
                                                                    ${(item.product.price * item.quantity).toFixed(2)}
                                                                </p>
                                                                <Button
                                                                    size="sm"
                                                                    color="danger"
                                                                    variant="light"
                                                                    className="h-6 px-2 text-xs"
                                                                    onPress={() => removeFromCart(item.product.id)}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollShadow>
                        )}
                    </DrawerBody>

                    {items.length > 0 && (
                        <DrawerFooter className="flex flex-col space-y-3">
                            <Divider/>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-900">Total:</span>
                                <span className="font-bold text-lg">${getTotalPrice().toFixed(2)}</span>
                            </div>

                            <div className="flex flex-col space-y-2 w-full">
                                <Button
                                    color="primary"
                                    size="lg"
                                    className="w-full"
                                    onPress={handleViewCart}
                                >
                                    View Cart & Checkout
                                </Button>
                                <Button
                                    variant="bordered"
                                    size="lg"
                                    className="w-full"
                                    onPress={handleContinueShopping}
                                >
                                    Continue Shopping
                                </Button>
                            </div>
                        </DrawerFooter>
                    )}
                </>
            </DrawerContent>
        </Drawer>
    );
};

export default CartSidebar;
