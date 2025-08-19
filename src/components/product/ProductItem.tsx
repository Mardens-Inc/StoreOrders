import {Button, Card, CardBody} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {Product} from "../../providers/CartProvider.tsx";

type ProductItemProps = {
    product: Product;
    viewMode: "grid" | "list";
    onAddToCart: (product: Product) => void;
}
export const ProductItem = (props: ProductItemProps) =>
{
    const {product, viewMode, onAddToCart} = props;

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

                    {/* Add to Cart Button */}
                    <Button
                        color="primary"
                        onPress={() => onAddToCart(product)}
                        startContent={<Icon icon="lucide:shopping-cart" className="w-4 h-4"/>}
                        fullWidth={viewMode === "grid"}
                    >
                        Add to Cart
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
};