import React from "react";
import {useNavigate} from "react-router-dom";
import {Button, Card, CardBody, Chip, Divider, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useCart} from "../../providers/CartProvider";
import {useLayout} from "../../providers/LayoutProvider";

const CartSidebar: React.FC = () =>
{
    const navigate = useNavigate();
    const {isMobile} = useLayout();
    const {
        items,
        isOpen,
        setIsOpen,
        updateQuantity,
        removeFromCart,
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
        // Navigate to cart for checkout flow
        navigate("/app/cart");
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
            size={isMobile ? "full" : "md"}
            backdrop={"blur"}
        >
            <DrawerContent>
                <DrawerHeader className="flex flex-col gap-1 px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icon icon="lucide:shopping-cart" className="w-5 h-5"/>
                            <span className="text-lg font-semibold">Your Cart</span>
                            <Chip size="sm" variant="flat">
                                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
                            </Chip>
                        </div>
                        <Button
                            isIconOnly
                            variant="light"
                            onPress={handleClose}
                            className="min-h-[44px] min-w-[44px]"
                        >
                            <Icon icon="lucide:x" className="w-5 h-5"/>
                        </Button>
                    </div>
                </DrawerHeader>

                <DrawerBody className="px-4 sm:px-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <Icon icon="lucide:shopping-cart" className="w-16 h-16 text-gray-300 mb-4"/>
                            <h3 className="text-lg font-semibold text-gray-500 mb-2">Your cart is empty</h3>
                            <p className="text-gray-400 mb-4">Add some products to get started</p>
                            <Button
                                color="primary"
                                onPress={handleContinueShopping}
                                className="min-h-[44px]"
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {items.map((item) => (
                                <Card key={item.product.id} shadow="sm">
                                    <CardBody className="p-3 sm:p-4">
                                        <div className="flex gap-3">
                                            {/* Product Image */}
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                                                <img
                                                    src={item.product.imageUrl}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover rounded-lg bg-gray-100"
                                                />
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm sm:text-base line-clamp-2 mb-1">
                                                    {item.product.name}
                                                </h4>
                                                <p className="text-xs sm:text-sm text-gray-500 mb-2">
                                                    SKU: {item.product.sku}
                                                </p>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size={isMobile ? "md" : "sm"}
                                                            variant="flat"
                                                            isIconOnly
                                                            onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                            className={isMobile ? "min-h-[44px] min-w-[44px]" : ""}
                                                        >
                                                            <Icon icon="lucide:minus" className="w-3 h-3"/>
                                                        </Button>
                                                        <span className="text-sm font-medium min-w-[2rem] text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            size={isMobile ? "md" : "sm"}
                                                            variant="flat"
                                                            isIconOnly
                                                            onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                            className={isMobile ? "min-h-[44px] min-w-[44px]" : ""}
                                                        >
                                                            <Icon icon="lucide:plus" className="w-3 h-3"/>
                                                        </Button>
                                                    </div>

                                                    <Button
                                                        size={isMobile ? "md" : "sm"}
                                                        variant="light"
                                                        color="danger"
                                                        isIconOnly
                                                        onPress={() => removeFromCart(item.product.id)}
                                                        className={isMobile ? "min-h-[44px] min-w-[44px]" : ""}
                                                    >
                                                        <Icon icon="lucide:trash-2" className="w-3 h-3"/>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}

                            <Divider/>

                            {/* Clear Cart Button */}
                            <div className="flex justify-center">
                                <Button
                                    variant="light"
                                    color="danger"
                                    size={isMobile ? "md" : "sm"}
                                    onPress={handleClearCart}
                                    startContent={<Icon icon="lucide:trash-2" className="w-4 h-4"/>}
                                    className={isMobile ? "min-h-[44px]" : ""}
                                >
                                    Clear Cart
                                </Button>
                            </div>
                        </div>
                    )}
                </DrawerBody>

                {items.length > 0 && (
                    <DrawerFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
                        <div className="flex flex-col gap-3 w-full">
                            <Button
                                color="primary"
                                size="lg"
                                onPress={handleCheckout}
                                startContent={<Icon icon="lucide:credit-card" className="w-4 h-4"/>}
                                className="min-h-[48px]"
                            >
                                Proceed to Checkout
                            </Button>
                            <Button
                                variant="bordered"
                                onPress={handleContinueShopping}
                                className="min-h-[44px]"
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    );
};

export default CartSidebar;
