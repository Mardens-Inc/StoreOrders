import React, {useEffect, useState} from "react";
import {Button, Card, CardBody, CardHeader, Chip, Image, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, useDisclosure} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useAuth} from "../../providers/AuthProvider";
import {apiClient, categoriesApi} from "../../utils/api";
import ImageCropModal from "../ImageCropModal";
import CreateProductModal from "../modals/CreateProductModal";
import EditProductModal from "../modals/EditProductModal";
import DeleteProductModal from "../modals/DeleteProductModal";
import CreateCategoryModal from "../modals/CreateCategoryModal";
import EditCategoryModal from "../modals/EditCategoryModal";
import DeleteCategoryModal from "../modals/DeleteCategoryModal";

interface Product
{
    id: string;
    name: string;
    description: string;
    sku: string;
    price: number;
    category_id: string;
    image_url?: string;
    in_stock: boolean;
    stock_quantity: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Category
{
    id: string;
    name: string;
    description?: string;
    icon?: string;
}

interface CreateProductRequest
{
    name: string;
    description: string;
    sku: string;
    price: number;
    category_id: string;
    image_url?: string;
    stock_quantity: number;
}

interface UpdateProductRequest
{
    name?: string;
    description?: string;
    sku?: string;
    price?: number;
    category_id?: string;
    image_url?: string;
    in_stock?: boolean;
    stock_quantity?: number;
    is_active?: boolean;
}

interface CreateCategoryRequest
{
    name: string;
    description?: string;
    icon?: string;
}

interface UpdateCategoryRequest
{
    name?: string;
    description?: string;
    icon?: string;
}

const ProductManagement: React.FC = () =>
{
    const {user: currentUser} = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Category management state
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryFormData, setCategoryFormData] = useState<CreateCategoryRequest>({
        name: "",
        description: "",
        icon: ""
    });

    const [formData, setFormData] = useState<CreateProductRequest>({
        name: "",
        description: "",
        sku: "",
        price: 0,
        category_id: "",
        image_url: "",
        stock_quantity: 0
    });

    // Image upload state
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const {isOpen: isCropModalOpen, onOpen: onCropModalOpen, onOpenChange: onCropModalOpenChange} = useDisclosure();

    const {isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange} = useDisclosure();
    const {isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange} = useDisclosure();
    const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange} = useDisclosure();

    // Category modal controls
    const {isOpen: isCreateCategoryOpen, onOpen: onCreateCategoryOpen, onOpenChange: onCreateCategoryOpenChange} = useDisclosure();
    const {isOpen: isEditCategoryOpen, onOpen: onEditCategoryOpen, onOpenChange: onEditCategoryOpenChange} = useDisclosure();
    const {isOpen: isDeleteCategoryOpen, onOpen: onDeleteCategoryOpen, onOpenChange: onDeleteCategoryOpenChange} = useDisclosure();

    // Load products and categories on component mount
    useEffect(() =>
    {
        loadData();
    }, []);

    const loadData = async () =>
    {
        try
        {
            setLoading(true);
            const [productsResponse, categoriesResponse] = await Promise.all([
                apiClient.get<{ success: boolean, data: Product[] }>("/products"),
                categoriesApi.getCategories()
            ]);

            if (productsResponse.success)
            {
                setProducts(productsResponse.data || []);
            }

            if (categoriesResponse.success)
            {
                setCategories(categoriesResponse.data || []);
            }
        } catch (error)
        {
            console.error("Failed to load data:", error);
        } finally
        {
            setLoading(false);
        }
    };

    const handleCreateProduct = async () =>
    {
        try
        {
            setActionLoading(true);
            const response = await apiClient.post("/products/admin", formData) as any;

            if (response.success)
            {
                await loadData();
                onCreateOpenChange();
                setFormData({
                    name: "",
                    description: "",
                    sku: "",
                    price: 0,
                    category_id: "",
                    image_url: "",
                    stock_quantity: 0
                });
            }
        } catch (error)
        {
            console.error("Failed to create product:", error);
        } finally
        {
            setActionLoading(false);
        }
    };

    const handleUpdateProduct = async () =>
    {
        if (!selectedProduct) return;

        try
        {
            setActionLoading(true);
            const updateData: UpdateProductRequest = {
                name: formData.name || undefined,
                description: formData.description || undefined,
                sku: formData.sku || undefined,
                price: formData.price || undefined,
                category_id: formData.category_id || undefined,
                image_url: formData.image_url || undefined,
                stock_quantity: formData.stock_quantity || undefined,
                in_stock: formData.stock_quantity > 0,
                is_active: true
            };

            const response = await apiClient.put(`/products/${selectedProduct.id}`, updateData) as any;

            if (response.success)
            {
                await loadData();
                onEditOpenChange();
                setSelectedProduct(null);
            }
        } catch (error)
        {
            console.error("Failed to update product:", error);
        } finally
        {
            setActionLoading(false);
        }
    };

    const handleDeleteProduct = async () =>
    {
        if (!selectedProduct) return;

        try
        {
            setActionLoading(true);
            const response = await apiClient.delete(`/products/${selectedProduct.id}`) as any;

            if (response.success)
            {
                await loadData();
                onDeleteOpenChange();
                setSelectedProduct(null);
            }
        } catch (error)
        {
            console.error("Failed to delete product:", error);
        } finally
        {
            setActionLoading(false);
        }
    };

    const handleToggleStock = async (product: Product) =>
    {
        try
        {
            const updateData = {
                in_stock: !product.in_stock,
                stock_quantity: !product.in_stock ? 1 : 0
            };

            const response = await apiClient.put(`/products/${product.id}`, updateData) as any;

            if (response.success)
            {
                await loadData();
            }
        } catch (error)
        {
            console.error("Failed to toggle stock:", error);
        }
    };

    const handleToggleActive = async (product: Product) =>
    {
        try
        {
            const updateData = {
                is_active: !product.is_active
            };

            const response = await apiClient.put(`/products/${product.id}`, updateData) as any;

            if (response.success)
            {
                await loadData();
            }
        } catch (error)
        {
            console.error("Failed to toggle active status:", error);
        }
    };

    const openEditModal = (product: Product) =>
    {
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            sku: product.sku,
            price: product.price,
            category_id: product.category_id,
            image_url: product.image_url || "",
            stock_quantity: product.stock_quantity
        });
        onEditOpen();
    };

    const openDeleteModal = (product: Product) =>
    {
        setSelectedProduct(product);
        onDeleteOpen();
    };

    const getCategoryName = (categoryId: string) =>
    {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : "Unknown Category";
    };

    const getStockStatusColor = (inStock: boolean) =>
    {
        return inStock ? "success" : "danger";
    };

    const getActiveStatusColor = (isActive: boolean) =>
    {
        return isActive ? "primary" : "default";
    };

    // Image upload functions
    const handleImageSelect = (file: File) =>
    {
        setSelectedImageFile(file);
        onCropModalOpen();
    };

    const handleCroppedImage = async (croppedFile: File | null) =>
    {
        onCropModalOpenChange();

        if (croppedFile)
        {
            try
            {
                setUploadingImage(true);

                // Convert file to array buffer and send as raw bytes
                const fileBuffer = await croppedFile.arrayBuffer();

                // Upload the image
                const response = await fetch("/api/upload/product-image", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
                        "Content-Type": "application/octet-stream"
                    },
                    body: fileBuffer
                });

                const result = await response.json();

                if (response.ok && result.success)
                {
                    // Update form data with the uploaded image URL
                    setFormData(prev => ({
                        ...prev,
                        image_url: result.url
                    }));
                } else
                {
                    console.error("Failed to upload image:", result.error || "Unknown error");
                    alert("Failed to upload image: " + (result.error || "Unknown error"));
                }
            } catch (error)
            {
                console.error("Error uploading image:", error);
                alert("Error uploading image. Please try again.");
            } finally
            {
                setUploadingImage(false);
            }
        }

        setSelectedImageFile(null);
    };

    // Category management functions
    const handleCreateCategory = async () => {
        try {
            setActionLoading(true);
            const response = await categoriesApi.createCategory(categoryFormData);

            if (response.success) {
                await loadData();
                onCreateCategoryOpenChange();
                setCategoryFormData({
                    name: "",
                    description: "",
                    icon: ""
                });
            }
        } catch (error) {
            console.error("Failed to create category:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateCategory = async () => {
        if (!selectedCategory) return;

        try {
            setActionLoading(true);
            const updateData: UpdateCategoryRequest = {
                name: categoryFormData.name || undefined,
                description: categoryFormData.description || undefined,
                icon: categoryFormData.icon || undefined
            };

            const response = await categoriesApi.updateCategory(selectedCategory.id, updateData);

            if (response.success) {
                await loadData();
                onEditCategoryOpenChange();
                setSelectedCategory(null);
            }
        } catch (error) {
            console.error("Failed to update category:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategory) return;

        try {
            setActionLoading(true);
            const response = await categoriesApi.deleteCategory(selectedCategory.id);

            if (response.success) {
                await loadData();
                onDeleteCategoryOpenChange();
                setSelectedCategory(null);
            }
        } catch (error) {
            console.error("Failed to delete category:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const openEditCategoryModal = (category: Category) => {
        setSelectedCategory(category);
        setCategoryFormData({
            name: category.name,
            description: category.description || "",
            icon: category.icon || ""
        });
        onEditCategoryOpen();
    };

    const openDeleteCategoryModal = (category: Category) => {
        setSelectedCategory(category);
        onDeleteCategoryOpen();
    };

    // Check if current user is admin
    if (currentUser?.role !== "admin")
    {
        return (
            <div className="p-6">
                <Card className="max-w-md mx-auto">
                    <CardBody className="text-center py-8">
                        <Icon icon="lucide:shield-x" className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                        <p className="text-gray-600">You need administrator privileges to access product management.</p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Available icons for categories
    const availableIcons = [
        { value: "lucide:briefcase", label: "Office Supplies", icon: "lucide:briefcase" },
        { value: "lucide:spray-can", label: "Cleaning Supplies", icon: "lucide:spray-can" },
        { value: "lucide:coffee", label: "Break Room", icon: "lucide:coffee" },
        { value: "lucide:file-text", label: "Paper Products", icon: "lucide:file-text" },
        { value: "lucide:laptop", label: "Technology", icon: "lucide:laptop" },
        { value: "lucide:armchair", label: "Furniture", icon: "lucide:armchair" },
        { value: "lucide:shield", label: "Safety Equipment", icon: "lucide:shield" },
        { value: "lucide:wrench", label: "Maintenance", icon: "lucide:wrench" },
        { value: "lucide:package", label: "General Products", icon: "lucide:package" },
        { value: "lucide:shopping-cart", label: "Shopping", icon: "lucide:shopping-cart" },
        { value: "lucide:tool-case", label: "Tools", icon: "lucide:tool-case" },
        { value: "lucide:car", label: "Automotive", icon: "lucide:car" },
        { value: "lucide:home", label: "Home & Garden", icon: "lucide:home" },
        { value: "lucide:shirt", label: "Clothing", icon: "lucide:shirt" },
        { value: "lucide:utensils", label: "Food & Beverage", icon: "lucide:utensils" },
        { value: "lucide:gamepad-2", label: "Electronics", icon: "lucide:gamepad-2" }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
                    <p className="text-gray-600">Manage products, inventory, and pricing</p>
                </div>
                <Button
                    color="primary"
                    onPress={onCreateOpen}
                    startContent={<Icon icon="lucide:plus" className="w-4 h-4"/>}
                >
                    Add Product
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Products</h2>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="lg"/>
                        </div>
                    ) : (
                        <Table aria-label="Products table" removeWrapper>
                            <TableHeader>
                                <TableColumn>IMAGE</TableColumn>
                                <TableColumn>NAME</TableColumn>
                                <TableColumn>SKU</TableColumn>
                                <TableColumn>PRICE</TableColumn>
                                <TableColumn>CATEGORY</TableColumn>
                                <TableColumn>STOCK</TableColumn>
                                <TableColumn>STATUS</TableColumn>
                                <TableColumn>ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                                {product.image_url ? (
                                                    <Image
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
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
                                        <TableCell>{product.sku}</TableCell>
                                        <TableCell>${product.price.toFixed(2)}</TableCell>
                                        <TableCell>{getCategoryName(product.category_id)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Chip color={getStockStatusColor(product.in_stock)} variant="flat" size="sm">
                                                    {product.in_stock ? "In Stock" : "Out of Stock"}
                                                </Chip>
                                                <span className="text-sm text-gray-500">({product.stock_quantity})</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip color={getActiveStatusColor(product.is_active)} variant="flat" size="sm">
                                                {product.is_active ? "Active" : "Inactive"}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="primary"
                                                    isIconOnly
                                                    onPress={() => openEditModal(product)}
                                                >
                                                    <Icon icon="lucide:edit" className="w-4 h-4"/>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color={product.in_stock ? "danger" : "success"}
                                                    isIconOnly
                                                    onPress={() => handleToggleStock(product)}
                                                >
                                                    <Icon icon={product.in_stock ? "lucide:package-x" : "lucide:package-check"} className="w-4 h-4"/>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color={product.is_active ? "warning" : "success"}
                                                    isIconOnly
                                                    onPress={() => handleToggleActive(product)}
                                                >
                                                    <Icon icon={product.is_active ? "lucide:eye-off" : "lucide:eye"} className="w-4 h-4"/>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="danger"
                                                    isIconOnly
                                                    onPress={() => openDeleteModal(product)}
                                                >
                                                    <Icon icon="lucide:trash" className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            {/* Create Product Modal */}
            <CreateProductModal
                isOpen={isCreateOpen}
                onOpenChange={onCreateOpenChange}
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onCreateProduct={handleCreateProduct}
                onImageSelect={handleImageSelect}
                actionLoading={actionLoading}
                uploadingImage={uploadingImage}
            />

            {/* Edit Product Modal */}
            <EditProductModal
                isOpen={isEditOpen}
                onOpenChange={onEditOpenChange}
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onUpdateProduct={handleUpdateProduct}
                onImageSelect={handleImageSelect}
                actionLoading={actionLoading}
                uploadingImage={uploadingImage}
            />

            {/* Delete Product Modal */}
            <DeleteProductModal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                selectedProduct={selectedProduct}
                onDeleteProduct={handleDeleteProduct}
                actionLoading={actionLoading}
            />

            {/* Image Crop Modal */}
            <ImageCropModal
                image={selectedImageFile}
                isOpen={isCropModalOpen}
                onClose={handleCroppedImage}
                aspectRatio={308 / 192}
                cropWidth={308}
                cropHeight={192}
            />

            {/* Category Management Section */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center w-full">
                        <h2 className="text-lg font-semibold">Categories</h2>
                        <Button
                            color="primary"
                            onPress={onCreateCategoryOpen}
                            startContent={<Icon icon="lucide:plus" className="w-4 h-4"/>}
                        >
                            Add Category
                        </Button>
                    </div>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="lg"/>
                        </div>
                    ) : (
                        <Table aria-label="Categories table" removeWrapper>
                            <TableHeader>
                                <TableColumn width={64} maxWidth={64} hideHeader>ICON</TableColumn>
                                <TableColumn>NAME</TableColumn>
                                <TableColumn width={64} maxWidth={64} hideHeader>ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                {category.icon ? (
                                                    <Icon icon={category.icon} className="w-5 h-5 text-gray-600"/>
                                                ) : (
                                                    <Icon icon="lucide:folder" className="w-5 h-5 text-gray-400"/>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{category.name}</p>
                                                <p className="text-sm text-gray-500 truncate max-w-48">{category.description}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="primary"
                                                    isIconOnly
                                                    onPress={() => openEditCategoryModal(category)}
                                                >
                                                    <Icon icon="lucide:edit" className="w-4 h-4"/>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="danger"
                                                    isIconOnly
                                                    onPress={() => openDeleteCategoryModal(category)}
                                                >
                                                    <Icon icon="lucide:trash" className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            {/* Create Category Modal */}
            <CreateCategoryModal
                isOpen={isCreateCategoryOpen}
                onOpenChange={onCreateCategoryOpenChange}
                categoryFormData={categoryFormData}
                setCategoryFormData={setCategoryFormData}
                onCreateCategory={handleCreateCategory}
                actionLoading={actionLoading}
                availableIcons={availableIcons}
            />

            {/* Edit Category Modal */}
            <EditCategoryModal
                isOpen={isEditCategoryOpen}
                onOpenChange={onEditCategoryOpenChange}
                categoryFormData={categoryFormData}
                setCategoryFormData={setCategoryFormData}
                onUpdateCategory={handleUpdateCategory}
                actionLoading={actionLoading}
                availableIcons={availableIcons}
            />

            {/* Delete Category Modal */}
            <DeleteCategoryModal
                isOpen={isDeleteCategoryOpen}
                onOpenChange={onDeleteCategoryOpenChange}
                selectedCategory={selectedCategory}
                onDeleteCategory={handleDeleteCategory}
                actionLoading={actionLoading}
            />
        </div>
    );
};

export default ProductManagement;
