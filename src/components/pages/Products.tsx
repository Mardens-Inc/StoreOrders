import React, {useEffect, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import {Button, ButtonGroup, Card, CardBody, Chip, Image, Pagination, Select, SelectItem, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {Product, useCart} from "../../providers/CartProvider";
import {categoriesApi, productsApi} from "../../utils/api";
import {Category} from "./Categories.tsx";
import {ProductItem} from "../product/ProductItem.tsx";
import {Input} from "../extension/Input.tsx";

enum ViewMode
{
    GRID = "grid",
    LIST = "list",
    TABLE = "table",
    GRID_COMPACT = "grid-compact",
}

const Products: React.FC = () =>
{
    const {categoryId} = useParams<{ categoryId: string }>();
    const {addToCart} = useCart();
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>(
        localStorage.getItem("category_view_mode") as ViewMode || ViewMode.GRID
    );
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [category, setCategory] = useState<Category | undefined>(undefined);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(() =>
    {
        const savedItemsPerPage = localStorage.getItem("items_per_page");
        return savedItemsPerPage ? parseInt(savedItemsPerPage) : 25;
    });

    useEffect(() =>
    {
        localStorage.setItem("items_per_page", itemsPerPage.toString());
    }, [itemsPerPage]);

    useEffect(() =>
    {

        categoriesApi.getCategories().then(categoriesResponse =>
        {
            if (categoriesResponse.success && categoriesResponse.data)
            {
                const category = (categoriesResponse.data as Category[]).find(i => i.id === categoryId);
                setCategory(category);
                if (category) document.title = `Browse ${category.name} - Store Orders`;
                else document.title = "Browse All Products - Store Orders";
            }
        });
        const fetchProducts = async () =>
        {
            try
            {
                setLoading(true);
                setError(null);

                let response;
                if (categoryId)
                {
                    // Fetch products by category if categoryId is provided
                    response = await productsApi.getProductsByCategory(categoryId);
                } else
                {
                    // Fetch all products with optional filters
                    const filters = {
                        search: searchTerm || undefined,
                        limit: 100 // Reasonable limit for display
                    };
                    response = await productsApi.getProducts(filters);
                }

                if (response.success && response.data)
                {
                    // Transform API response to match Product interface
                    const transformedProducts: Product[] = response.data.map((apiProduct: any) => ({
                        id: apiProduct.product?.id || apiProduct.id,
                        name: apiProduct.product?.name || apiProduct.name,
                        description: apiProduct.product?.description || apiProduct.description,
                        category_id: apiProduct.product?.category_id || apiProduct.category_id,
                        imageUrl: apiProduct.product?.image_url || apiProduct.image_url || "/api/placeholder/300/300",
                        sku: apiProduct.product?.sku || apiProduct.sku,
                        price: apiProduct.product?.price ?? apiProduct.price ?? 0,
                        in_stock: apiProduct.product?.in_stock ?? apiProduct.in_stock ?? true,
                        stock_quantity: apiProduct.product?.stock_quantity ?? apiProduct.stock_quantity ?? 0,
                        is_active: apiProduct.product?.is_active ?? apiProduct.is_active ?? true,
                        created_at: apiProduct.product?.created_at ?? apiProduct.created_at,
                        updated_at: apiProduct.product?.updated_at ?? apiProduct.updated_at,
                        image_url: apiProduct.product?.image_url ?? apiProduct.image_url
                    }));
                    setProducts(transformedProducts);
                } else
                {
                    setError("Failed to load products");
                }
            } catch (err)
            {
                console.error("Error fetching products:", err);
                setError("Failed to load products. Please try again.");
            } finally
            {
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

        // Sort by name only since price may not change ordering requirements now
        filtered.sort((a, b) => a.name.localeCompare(b.name));

        return filtered;
    }, [products, searchTerm]);

    // Paginated products
    const paginatedProducts = useMemo(() =>
    {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

    // Reset pagination when items per page or search changes
    useEffect(() =>
    {
        setCurrentPage(1);
    }, [itemsPerPage, searchTerm]);

    useEffect(() =>
    {
        localStorage.setItem("category_view_mode", viewMode);
    }, [viewMode]);

    const handleAddToCart = (product: Product) =>
    {
        addToCart(product);
    };

    const renderTableView = () => (
        <Card>
            <CardBody>
                <Table aria-label="Products table" removeWrapper>
                    <TableHeader>
                        <TableColumn width={80}>IMAGE</TableColumn>
                        <TableColumn>NAME</TableColumn>
                        <TableColumn>SKU</TableColumn>
                        <TableColumn>PRICE</TableColumn>
                        <TableColumn>STOCK</TableColumn>
                        <TableColumn>STATUS</TableColumn>
                        <TableColumn width={100}>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {paginatedProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                        {product.image_url ? (
                                            <Image
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                                radius="md"
                                            />
                                        ) : (
                                            <Icon icon="lucide:image" className="w-6 h-6 text-gray-400"/>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-gray-500 truncate max-w-48">{product.description}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{product.sku}</code>
                                </TableCell>
                                <TableCell>
                                    <span className="font-semibold text-green-600">${product.price.toFixed(2)}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Chip
                                            color={product.in_stock ? "success" : "danger"}
                                            variant="flat"
                                            size="sm"
                                        >
                                            {product.in_stock ? "In Stock" : "Out of Stock"}
                                        </Chip>
                                        {product.stock_quantity !== undefined && (
                                            <span className="text-sm text-gray-500">({product.stock_quantity})</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        color={product.is_active ? "success" : "warning"}
                                        variant="flat"
                                        size="sm"
                                    >
                                        {product.is_active ? "Active" : "Inactive"}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        variant="flat"
                                        onPress={() => handleAddToCart(product)}
                                        isDisabled={!product.in_stock || !product.is_active}
                                        startContent={<Icon icon="lucide:shopping-cart" className="w-4 h-4"/>}
                                    >
                                        Add
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            loop
                            isCompact
                            showControls
                            page={currentPage}
                            total={totalPages}
                            onChange={setCurrentPage}
                        />
                    </div>
                )}
            </CardBody>
        </Card>
    );

    const renderGridView = () => (
        <>
            <div className={viewMode === ViewMode.GRID || viewMode === ViewMode.GRID_COMPACT
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
                {paginatedProducts.map((product) =>
                    <ProductItem
                        key={product.id}
                        product={product}
                        viewMode={viewMode}
                        onAddToCart={handleAddToCart}
                    />
                )}
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <Pagination
                        loop
                        isCompact
                        showControls
                        page={currentPage}
                        total={totalPages}
                        onChange={setCurrentPage}
                    />
                </div>
            )}
        </>
    );

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
                    <h1 className="text-2xl font-bold text-gray-900 flex flex-row gap-2 items-center">
                        {category?.icon && <Icon icon={category.icon}/>}
                        {categoryId ? category?.name || "Products" : "All Products"}
                    </h1>
                    <p className="text-gray-600">
                        {categoryId ? <>Browse <span className={"font-bold italic"}>{category?.name}</span> products</> : "Browse all available products"}
                    </p>
                    {filteredAndSortedProducts.length > 0 && (
                        <div className="text-sm text-gray-500">
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedProducts.length)}-{Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
                        </div>
                    )}
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        label={"Search products"}
                        placeholder="NB-001, Nike, Shoes, Tarps..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400"/>}
                        className="w-full sm:w-80"
                        size={"sm"}
                    />

                    <Select
                        label={"Items per Page"}
                        selectedKeys={[itemsPerPage.toString()]}
                        onSelectionChange={(keys) => setItemsPerPage(Number(Array.from(keys)[0]))}
                        className="min-w-48 w-48"
                        size="sm"
                    >
                        <SelectItem key="10" textValue="10">10</SelectItem>
                        <SelectItem key="25" textValue="25">25</SelectItem>
                        <SelectItem key="50" textValue="50">50</SelectItem>
                        <SelectItem key="100" textValue="100">100</SelectItem>
                    </Select>
                    {/* View Mode Toggle */}
                    <ButtonGroup>
                        <Button
                            variant={viewMode === ViewMode.GRID ? "solid" : "bordered"}
                            color={viewMode === ViewMode.GRID ? "primary" : "default"}
                            onPress={() => setViewMode(ViewMode.GRID)}
                            isIconOnly
                        >
                            <Icon icon="lucide:grid-3x3" className="w-4 h-4"/>
                        </Button>
                        <Button
                            variant={viewMode === ViewMode.GRID_COMPACT ? "solid" : "bordered"}
                            color={viewMode === ViewMode.GRID_COMPACT ? "primary" : "default"}
                            onPress={() => setViewMode(ViewMode.GRID_COMPACT)}
                            isIconOnly
                        >
                            <Icon icon="lucide:grid-2x2" className="w-4 h-4"/>
                        </Button>
                        <Button
                            variant={viewMode === ViewMode.LIST ? "solid" : "bordered"}
                            color={viewMode === ViewMode.LIST ? "primary" : "default"}
                            onPress={() => setViewMode(ViewMode.LIST)}
                            isIconOnly
                        >
                            <Icon icon="lucide:list" className="w-4 h-4"/>
                        </Button>
                        <Button
                            variant={viewMode === ViewMode.TABLE ? "solid" : "bordered"}
                            color={viewMode === ViewMode.TABLE ? "primary" : "default"}
                            onPress={() => setViewMode(ViewMode.TABLE)}
                            isIconOnly
                        >
                            <Icon icon="lucide:table" className="w-4 h-4"/>
                        </Button>
                    </ButtonGroup>
                </div>
            </div>


            {/* Products Grid/List/Table */}
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
                viewMode === ViewMode.TABLE ? renderTableView() : renderGridView()
            )}
        </div>
    );
};


export default Products;
