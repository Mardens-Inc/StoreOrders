import React, {useEffect, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import {Button, ButtonGroup, Card, CardBody, Input, Select, SelectItem, Spinner} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {Product, useCart} from "../../providers/CartProvider";
import {productsApi} from "../../utils/api";

const Products: React.FC = () =>
{
    const {categoryId} = useParams<{ categoryId: string }>();
    const {addToCart} = useCart();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const categoryNames: { [key: string]: string } = {
        "office-supplies": "Office Supplies",
        "cleaning-supplies": "Cleaning Supplies",
        "break-room": "Break Room",
        "paper-products": "Paper Products",
        "technology": "Technology",
        "furniture": "Furniture",
        "safety-equipment": "Safety Equipment",
        "maintenance": "Maintenance"
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                
                let response;
                if (categoryId) {
                    // Fetch products by category if categoryId is provided
                    response = await productsApi.getProductsByCategory(categoryId);
                } else {
                    // Fetch all products with optional filters
                    const filters = {
                        search: searchTerm || undefined,
                        limit: 100, // Reasonable limit for display
                    };
                    response = await productsApi.getProducts(filters);
                }

                if (response.success && response.data) {
                    // Transform API response to match Product interface
                    const transformedProducts: Product[] = response.data.map((apiProduct: any) => ({
                        id: apiProduct.product?.id || apiProduct.id,
                        name: apiProduct.product?.name || apiProduct.name,
                        description: apiProduct.product?.description || apiProduct.description,
                        category_id: apiProduct.product?.category_id || apiProduct.category_id,
                        imageUrl: apiProduct.product?.image_url || apiProduct.image_url || "/api/placeholder/300/300",
                        sku: apiProduct.product?.sku || apiProduct.sku,
                    }));
                    setProducts(transformedProducts);
                } else {
                    setError("Failed to load products");
                }
            } catch (err) {
                console.error("Error fetching products:", err);
                setError("Failed to load products. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [categoryId, searchTerm]); // Re-fetch when category or search changes

    const filteredAndSortedProducts = useMemo(() =>
    {
        let filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sort by name only since price is no longer available
        filtered.sort((a, b) => a.name.localeCompare(b.name));

        return filtered;
    }, [products, searchTerm]);

    const handleAddToCart = (product: Product) =>
    {
        addToCart(product);
    };

    if (loading)
    {
        return (
            <div className="flex justify-center items-center min-h-96">
                <Spinner size="lg"/>
            </div>
        );
    }

    if (error)
    {
        return (
            <div className="p-6">
                <Card className="max-w-md mx-auto">
                    <CardBody className="text-center py-8">
                        <Icon icon="lucide:alert-circle" className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                        <h2 className="text-xl font-semibold mb-2">Error Loading Products</h2>
                        <p className="text-gray-600">{error}</p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {categoryId ? categoryNames[categoryId] || "Products" : "All Products"}
                    </h1>
                    <p className="text-gray-600">
                        {categoryId ? `Browse ${categoryNames[categoryId]} products` : "Browse all available products"}
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400"/>}
                        className="w-full sm:w-80"
                    />

                    <Select
                        placeholder="Sort by"
                        selectedKeys={[sortBy]}
                        onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                        className="w-full sm:w-40"
                    >
                        <SelectItem key="name">Name</SelectItem>
                    </Select>

                    {/* View Mode Toggle */}
                    <ButtonGroup>
                        <Button
                            variant={viewMode === "grid" ? "solid" : "bordered"}
                            color={viewMode === "grid" ? "primary" : "default"}
                            onPress={() => setViewMode("grid")}
                            isIconOnly
                        >
                            <Icon icon="lucide:grid-3x3" className="w-4 h-4"/>
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "solid" : "bordered"}
                            color={viewMode === "list" ? "primary" : "default"}
                            onPress={() => setViewMode("list")}
                            isIconOnly
                        >
                            <Icon icon="lucide:list" className="w-4 h-4"/>
                        </Button>
                    </ButtonGroup>
                </div>
            </div>

            {/* Products Grid/List */}
            {filteredAndSortedProducts.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-16">
                        <Icon icon="lucide:package-x" className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
                        <p className="text-gray-600">
                            {searchTerm ? "Try adjusting your search terms." : "No products available in this category."}
                        </p>
                    </CardBody>
                </Card>
            ) : (
                <div className={viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                }>
                    {filteredAndSortedProducts.map((product) => (
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
                                        onPress={() => handleAddToCart(product)}
                                        startContent={<Icon icon="lucide:shopping-cart" className="w-4 h-4"/>}
                                        className="w-full"
                                    >
                                        Add to Cart
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Products;
