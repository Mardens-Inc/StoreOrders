import React, {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Button, ButtonGroup, Card, CardBody, CardHeader, Chip, Input, Select, SelectItem, Spinner} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {Product, useCart} from "../../providers/CartProvider";
import {productsApi} from "../../utils/api";

const Products: React.FC = () =>
{
    const {categoryId} = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
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
                        id: apiProduct.id,
                        name: apiProduct.name,
                        description: apiProduct.description,
                        price: apiProduct.price,
                        category_id: apiProduct.category_id,
                        imageUrl: apiProduct.image_url || "/api/placeholder/300/300",
                        inStock: apiProduct.in_stock,
                        sku: apiProduct.sku,
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

        switch (sortBy)
        {
            case "price-low":
                filtered.sort((a, b) => a.price - b.price);
                break;
            case "price-high":
                filtered.sort((a, b) => b.price - a.price);
                break;
            case "name":
            default:
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        return filtered;
    }, [products, searchTerm, sortBy]);

    const handleAddToCart = (product: Product) =>
    {
        addToCart(product);
    };

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card className="max-w-md mx-auto">
                    <CardBody className="text-center py-8">
                        <Icon icon="lucide:alert-circle" className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                        <h2 className="text-xl font-semibold mb-2">Error Loading Products</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button 
                            color="primary" 
                            onPress={() => window.location.reload()}
                        >
                            Try Again
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <Button
                    variant="light"
                    size="sm"
                    onPress={() => navigate("/app/categories")}
                    startContent={<Icon icon="lucide:chevron-left" className="w-4 h-4"/>}
                >
                    Categories
                </Button>
                <span>/</span>
                <span className="font-medium">{categoryNames[categoryId || ""] || "Products"}</span>
            </div>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {categoryNames[categoryId || ""] || "Products"}
                </h1>
                <p className="text-gray-600">
                    {filteredAndSortedProducts.length} products available
                </p>
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        placeholder="Search products..."
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
                        placeholder="Sort by"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        variant="bordered"
                        className="w-full sm:w-48"
                        classNames={{
                            trigger: "bg-white"
                        }}
                    >
                        <SelectItem key="name" textValue="name">Name A-Z</SelectItem>
                        <SelectItem key="price-low" textValue="price-low">Price: Low to High</SelectItem>
                        <SelectItem key="price-high" textValue="price-high">Price: High to Low</SelectItem>
                    </Select>
                </div>

                <ButtonGroup>
                    <Button
                        variant={viewMode === "grid" ? "solid" : "bordered"}
                        isIconOnly
                        onPress={() => setViewMode("grid")}
                    >
                        <Icon icon="lucide:grid-3x3" className="w-4 h-4"/>
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "solid" : "bordered"}
                        isIconOnly
                        onPress={() => setViewMode("list")}
                    >
                        <Icon icon="lucide:list" className="w-4 h-4"/>
                    </Button>
                </ButtonGroup>
            </div>

            {/* Products Grid/List */}
            <div className={
                viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
            }>
                {filteredAndSortedProducts.map((product) => (
                    <Card key={product.id} className="hover:shadow-lg transition-shadow">
                        {viewMode === "grid" ? (
                            <>
                                <CardHeader className="p-0">
                                    <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                                        {product.imageUrl && product.imageUrl !== "/api/placeholder/300/300" ? (
                                            <img 
                                                src={product.imageUrl} 
                                                alt={product.name}
                                                className="w-full h-full object-cover rounded-t-lg"
                                            />
                                        ) : (
                                            <Icon icon="lucide:package" className="w-16 h-16 text-gray-400"/>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <div className="mb-2">
                                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                        {product.description}
                                    </p>
                                    <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>
                                        <Chip
                                            size="sm"
                                            color={product.inStock ? "success" : "danger"}
                                            variant="flat"
                                        >
                                            {product.inStock ? "In Stock" : "Out of Stock"}
                                        </Chip>
                                    </div>
                                    <Button
                                        color="primary"
                                        className="w-full"
                                        isDisabled={!product.inStock}
                                        onPress={() => handleAddToCart(product)}
                                    >
                                        Add to Cart
                                    </Button>
                                </CardBody>
                            </>
                        ) : (
                            <CardBody className="p-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {product.imageUrl && product.imageUrl !== "/api/placeholder/300/300" ? (
                                            <img 
                                                src={product.imageUrl} 
                                                alt={product.name}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <Icon icon="lucide:package" className="w-8 h-8 text-gray-400"/>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-1">SKU: {product.sku}</p>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {product.description}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end space-y-2">
                    <span className="text-lg font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>
                                        <Chip
                                            size="sm"
                                            color={product.inStock ? "success" : "danger"}
                                            variant="flat"
                                        >
                                            {product.inStock ? "In Stock" : "Out of Stock"}
                                        </Chip>
                                        <Button
                                            color="primary"
                                            size="sm"
                                            isDisabled={!product.inStock}
                                            onPress={() => handleAddToCart(product)}
                                        >
                                            Add to Cart
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        )}
                    </Card>
                ))}
            </div>

            {/* No Results */}
            {filteredAndSortedProducts.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Icon icon="lucide:package-x" className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or filters</p>
                </div>
            )}
        </div>
    );
};

export default Products;