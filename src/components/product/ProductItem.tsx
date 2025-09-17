import {Button, Card, CardBody, Chip} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {Product, unitTypeToString} from "../../providers/CartProvider.tsx";
import {useState} from "react";

type ProductItemProps = {
    product: Product;
    viewMode: "grid" | "list" | "table" | "grid-compact";
    onAddToCart: (product: Product, quantity?: number) => void;
}
export const ProductItem = (props: ProductItemProps) =>
{
    const {product, viewMode, onAddToCart} = props;
    const [quantity, setQuantity] = useState<number>(1);

    const handleAddToCart = () => {
        onAddToCart(product, quantity);
    };

    const handleQuantityDecrease = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const handleQuantityIncrease = () => {
        if (quantity < (product.stock_quantity || 1)) {
            setQuantity(quantity + 1);
        }
    };

    if (viewMode === "grid-compact")
    {
        return (
            <Card className="h-full hover:shadow-lg transition-shadow">
                <CardBody className="p-4">
                    <div className="space-y-3">
                        <div>
                            <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">{product.sku}</code>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-green-600">${product.price.toFixed(2)}</span>
                            <div className="flex gap-2">
                                <Chip
                                    color={product.in_stock ? "success" : "danger"}
                                    variant="flat"
                                    size="sm"
                                >
                                    {product.in_stock ? `${product.stock_quantity} ${unitTypeToString(product.unit_type)} in Stock` : "Out of Stock"}
                                </Chip>
                                <Chip
                                    color={product.is_active ? "success" : "warning"}
                                    variant="flat"
                                    size="sm"
                                >
                                    {product.is_active ? "Active" : "Inactive"}
                                </Chip>
                            </div>
                        </div>

                        <div className="flex gap-2 items-center">
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    isIconOnly
                                    onPress={handleQuantityDecrease}
                                    isDisabled={quantity <= 1}
                                >
                                    <Icon icon="lucide:minus" className="w-3 h-3"/>
                                </Button>
                                <span className="text-sm font-medium min-w-[2rem] text-center">
                                    {quantity}
                                </span>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    isIconOnly
                                    onPress={handleQuantityIncrease}
                                    isDisabled={quantity >= (product.stock_quantity || 1)}
                                >
                                    <Icon icon="lucide:plus" className="w-3 h-3"/>
                                </Button>
                            </div>
                            <Button
                                color="primary"
                                onPress={handleAddToCart}
                                isDisabled={!product.in_stock || !product.is_active}
                                startContent={<Icon icon="lucide:shopping-cart" className="w-4 h-4"/>}
                                className="flex-1"
                            >
                                Add to Cart
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (

        <Card
            key={product.id}
            className={`hover:shadow-lg transition-shadow ${viewMode === "list" ? "flex flex-row" : ""}`}
        >
            <CardBody className={viewMode === "list" ? "flex flex-row gap-4 p-4" : "p-4"}>
                {/* Product Image */}
                <div className={viewMode === "list" ? "w-24 h-24 flex-shrink-0" : "w-full h-48 mb-4"}>
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg bg-gray-100"
                    />
                </div>

                {/* Product Info */}
                <div className={viewMode === "list" ? "flex-1" : ""}>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <p className="text-xs text-gray-500 mb-3">SKU: {product.sku}</p>

                    {/* Price and Status */}
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xl font-bold text-green-600">${product.price.toFixed(2)}</span>
                        <div className="flex gap-2">
                            <Chip
                                color={product.in_stock ? "success" : "danger"}
                                variant="flat"
                                size="sm"
                            >
                                {product.in_stock ? `${product.stock_quantity} ${unitTypeToString(product.unit_type)} in Stock` : "Out of Stock"}
                            </Chip>
                            <Chip
                                color={product.is_active ? "success" : "warning"}
                                variant="flat"
                                size="sm"
                            >
                                {product.is_active ? "Active" : "Inactive"}
                            </Chip>
                        </div>
                    </div>

                    {/* Quantity and Add to Cart */}
                    <div className={`flex gap-2 items-center ${viewMode === "grid" ? "flex-col" : ""}`}>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="flat"
                                isIconOnly
                                onPress={handleQuantityDecrease}
                                isDisabled={quantity <= 1}
                            >
                                <Icon icon="lucide:minus" className="w-3 h-3"/>
                            </Button>
                            <span className="text-sm font-medium min-w-[2rem] text-center">
                                {quantity}
                            </span>
                            <Button
                                size="sm"
                                variant="flat"
                                isIconOnly
                                onPress={handleQuantityIncrease}
                                isDisabled={quantity >= (product.stock_quantity || 1)}
                            >
                                <Icon icon="lucide:plus" className="w-3 h-3"/>
                            </Button>
                        </div>
                        <Button
                            color="primary"
                            onPress={handleAddToCart}
                            isDisabled={!product.in_stock || !product.is_active}
                            startContent={<Icon icon="lucide:shopping-cart" className="w-4 h-4"/>}
                            className={viewMode === "grid" ? "w-full" : "flex-1"}
                        >
                            Add to Cart
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};