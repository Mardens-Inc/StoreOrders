import React, {useEffect, useMemo, useState} from "react";
import {Button, Card, CardBody, CardHeader, Chip, Image, Pagination, Select, SelectItem, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useAuth} from "../../providers/AuthProvider";
import {categoriesApi, productsApi} from "../../utils/api";
import ImageCropModal from "../ImageCropModal";
import CreateProductModal from "../modals/CreateProductModal";
import DeleteProductModal from "../modals/DeleteProductModal";
import CreateCategoryModal from "../modals/CreateCategoryModal";
import EditCategoryModal from "../modals/EditCategoryModal";
import DeleteCategoryModal from "../modals/DeleteCategoryModal";
import {Product} from "../../providers/CartProvider";
import {Input} from "../extension/Input";

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
    category_id: string;
    image_url?: string;
    price: number;
    bin_location: string;
    unit_type: number; // 0=Each,1=Case,2=Roll
}

interface UpdateProductRequest
{
    name?: string;
    description?: string;
    sku?: string;
    category_id?: string;
    image_url?: string;
    is_active?: boolean;
    price?: number;
    bin_location?: string;
    unit_type?: number; // 0=Each,1=Case,2=Roll
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

const INITIAL_PRODUCT_FORM: CreateProductRequest = {
    name: "",
    description: "",
    sku: "",
    category_id: "",
    image_url: "",
    price: 0,
    bin_location: "",
    unit_type: 0
};

const ProductManagement: React.FC = () =>
{
    document.title = "Product Management - Store Orders";
    const {user: currentUser} = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Pagination and filtering state for products
    const [productPage, setProductPage] = useState(1);
    const [productSearchQuery, setProductSearchQuery] = useState("");
    const [productCategoryFilter, setProductCategoryFilter] = useState("");
    const [productStatusFilter, setProductStatusFilter] = useState("");
    const itemsPerPage = 10;

    // Pagination and filtering state for categories
    const [categoryPage, setCategoryPage] = useState(1);
    const [categorySearchQuery, setCategorySearchQuery] = useState("");

    // Product form state
    const [formData, setFormData] = useState<CreateProductRequest>(INITIAL_PRODUCT_FORM);

    // Category management state
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categoryFormData, setCategoryFormData] = useState<CreateCategoryRequest>({
        name: "",
        description: "",
        icon: ""
    });

    // Image upload state
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [pendingNewProductImage, setPendingNewProductImage] = useState<File | null>(null); // holds cropped image until product created
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

    // Reset form when create modal opens (fresh form each time)
    useEffect(() =>
    {
        if (isCreateOpen)
        {
            setSelectedProduct(null);
            setPendingNewProductImage(null);
            setFormData(INITIAL_PRODUCT_FORM);
        }
    }, [isCreateOpen]);

    // When edit modal closes, clear form so it doesn't leak into create modal
    useEffect(() =>
    {
        if (!isEditOpen)
        {
            setSelectedProduct(null);
            setPendingNewProductImage(null);
            setFormData(INITIAL_PRODUCT_FORM);
        }
    }, [isEditOpen]);

    const loadData = async () =>
    {
        try
        {
            setLoading(true);
            const [productsResponse, categoriesResponse] = await Promise.all([
                productsApi.getProducts(),
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
            // If we have a pending image file, don't send image_url yet (will upload after creation)
            const {image_url, ...rest} = formData as any;
            const createPayload = pendingNewProductImage ? rest : formData;
            const response = await productsApi.createProduct(createPayload as CreateProductRequest);

            if (response.success)
            {
                // If we have a pending image, upload it now using returned product id
                if (pendingNewProductImage && response.data?.id)
                {
                    await uploadProductImage(response.data.id, pendingNewProductImage, true);
                }
                await loadData();
                onCreateOpenChange();
                setFormData(INITIAL_PRODUCT_FORM);
                setPendingNewProductImage(null);
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
                category_id: formData.category_id || undefined,
                image_url: formData.image_url || undefined,
                is_active: true,
                price: formData.price || undefined,
                bin_location: formData.bin_location || undefined,
                unit_type: (formData.unit_type ?? undefined)
            };
            const response = await productsApi.updateProduct(selectedProduct.id, updateData);

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
            const response = await productsApi.deleteProduct(selectedProduct.id);


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

    const handleToggleActive = async (product: Product) =>
    {
        try
        {
            const updateData = {
                is_active: !product.is_active
            };

            const response = await productsApi.updateProduct(product.id, updateData) as any;

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
            category_id: product.category_id,
            image_url: product.image_url || "",
            price: product.price || 0,
            bin_location: product.bin_location || "",
            unit_type: (product.unit_type ?? 0)
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
            if (selectedProduct)
            {
                // Editing existing product: upload immediately
                await uploadProductImage(selectedProduct.id, croppedFile, false);
            } else
            {
                // Creating new product: store locally until product is created
                setPendingNewProductImage(croppedFile);
                const previewUrl = URL.createObjectURL(croppedFile);
                setFormData(prev => ({...prev, image_url: previewUrl}));
            }
        }

        setSelectedImageFile(null);
    };

    // Helper to upload product image given a hashed product id
    const uploadProductImage = async (productId: string, file: File, silent: boolean) =>
    {
        try
        {
            if (!silent) setUploadingImage(true);
            const fileBuffer = await file.arrayBuffer();
            const response = await fetch(`/api/upload/product-image/${productId}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
                    "Content-Type": "application/octet-stream"
                },
                body: fileBuffer
            });
            const result = await response.json().catch(() => ({}));
            if (response.ok && result.success)
            {
                // Update form data image_url if editing
                setFormData(prev => ({...prev, image_url: result.url}));
                // If editing existing product, refresh list for immediate UI update
                if (selectedProduct)
                {
                    await loadData();
                }
            } else
            {
                console.error("Failed to upload image:", result.error || "Unknown error");
                if (!silent) alert("Failed to upload image: " + (result.error || "Unknown error"));
            }
        } catch (e)
        {
            console.error("Error uploading image", e);
            if (!silent) alert("Error uploading image. Please try again.");
        } finally
        {
            if (!silent) setUploadingImage(false);
        }
    };

    // Category management functions
    const handleCreateCategory = async () =>
    {
        try
        {
            setActionLoading(true);
            const response = await categoriesApi.createCategory(categoryFormData);

            if (response.success)
            {
                await loadData();
                onCreateCategoryOpenChange();
                setCategoryFormData({
                    name: "",
                    description: "",
                    icon: ""
                });
            }
        } catch (error)
        {
            console.error("Failed to create category:", error);
        } finally
        {
            setActionLoading(false);
        }
    };

    const handleUpdateCategory = async () =>
    {
        if (!selectedCategory) return;

        try
        {
            setActionLoading(true);
            const updateData: UpdateCategoryRequest = {
                name: categoryFormData.name || undefined,
                description: categoryFormData.description || undefined,
                icon: categoryFormData.icon || undefined
            };

            const response = await categoriesApi.updateCategory(selectedCategory.id, updateData);

            if (response.success)
            {
                await loadData();
                onEditCategoryOpenChange();
                setSelectedCategory(null);
            }
        } catch (error)
        {
            console.error("Failed to update category:", error);
        } finally
        {
            setActionLoading(false);
        }
    };

    const handleDeleteCategory = async () =>
    {
        if (!selectedCategory) return;

        try
        {
            setActionLoading(true);
            const response = await categoriesApi.deleteCategory(selectedCategory.id);

            if (response.success)
            {
                await loadData();
                onDeleteCategoryOpenChange();
                setSelectedCategory(null);
            }
        } catch (error)
        {
            console.error("Failed to delete category:", error);
        } finally
        {
            setActionLoading(false);
        }
    };

    const openEditCategoryModal = (category: Category) =>
    {
        setSelectedCategory(category);
        setCategoryFormData({
            name: category.name,
            description: category.description || "",
            icon: category.icon || ""
        });
        onEditCategoryOpen();
    };

    const openDeleteCategoryModal = (category: Category) =>
    {
        setSelectedCategory(category);
        onDeleteCategoryOpen();
    };

    // Fuzzy search function
    const fuzzySearch = (query: string, text: string): boolean =>
    {
        if (!query) return true;
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();

        // Simple fuzzy search: check if all characters in query appear in order in text
        let queryIndex = 0;
        for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++)
        {
            if (textLower[i] === queryLower[queryIndex])
            {
                queryIndex++;
            }
        }
        return queryIndex === queryLower.length;
    };

    // Filtered and paginated products
    const filteredProducts = useMemo(() =>
    {
        return products.filter(product =>
        {
            // General search filter (fuzzy search on name and SKU)
            if (productSearchQuery)
            {
                const matchesName = fuzzySearch(productSearchQuery, product.name);
                const matchesSku = fuzzySearch(productSearchQuery, product.sku);
                if (!matchesName && !matchesSku) return false;
            }

            // Category filter
            if (productCategoryFilter && product.category_id !== productCategoryFilter)
            {
                return false;
            }

            // Status filter
            if (productStatusFilter)
            {
                const isActive = product.is_active ?? false;
                if (productStatusFilter === "active" && !isActive) return false;
                if (productStatusFilter === "inactive" && isActive) return false;
            }

            return true;
        });
    }, [products, productSearchQuery, productCategoryFilter, productStatusFilter]);

    const paginatedProducts = useMemo(() =>
    {
        const startIndex = (productPage - 1) * itemsPerPage;
        return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProducts, productPage]);

    const productTotalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Filtered and paginated categories
    const filteredCategories = useMemo(() =>
    {
        return categories.filter(category =>
        {
            if (categorySearchQuery)
            {
                const matchesName = fuzzySearch(categorySearchQuery, category.name);
                const matchesDescription = category.description ? fuzzySearch(categorySearchQuery, category.description) : false;
                return matchesName || matchesDescription;
            }
            return true;
        });
    }, [categories, categorySearchQuery]);

    const paginatedCategories = useMemo(() =>
    {
        const startIndex = (categoryPage - 1) * itemsPerPage;
        return filteredCategories.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCategories, categoryPage]);

    const categoryTotalPages = Math.ceil(filteredCategories.length / itemsPerPage);

    // Reset pagination when filters change
    useEffect(() =>
    {
        setProductPage(1);
    }, [productSearchQuery, productCategoryFilter, productStatusFilter]);

    useEffect(() =>
    {
        setCategoryPage(1);
    }, [categorySearchQuery]);

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
        {value: "lucide:briefcase", label: "Office Supplies", icon: "lucide:briefcase"},
        {value: "lucide:spray-can", label: "Cleaning Supplies", icon: "lucide:spray-can"},
        {value: "lucide:coffee", label: "Break Room", icon: "lucide:coffee"},
        {value: "lucide:file-text", label: "Paper Products", icon: "lucide:file-text"},
        {value: "lucide:laptop", label: "Technology", icon: "lucide:laptop"},
        {value: "lucide:armchair", label: "Furniture", icon: "lucide:armchair"},
        {value: "lucide:shield", label: "Safety Equipment", icon: "lucide:shield"},
        {value: "lucide:wrench", label: "Maintenance", icon: "lucide:wrench"},
        {value: "lucide:package", label: "General Products", icon: "lucide:package"},
        {value: "lucide:shopping-cart", label: "Shopping", icon: "lucide:shopping-cart"},
        {value: "lucide:tool-case", label: "Tools", icon: "lucide:tool-case"},
        {value: "lucide:car", label: "Automotive", icon: "lucide:car"},
        {value: "lucide:home", label: "Home & Garden", icon: "lucide:home"},
        {value: "lucide:shirt", label: "Clothing", icon: "lucide:shirt"},
        {value: "lucide:utensils", label: "Food & Beverage", icon: "lucide:utensils"},
        {value: "lucide:gamepad-2", label: "Electronics", icon: "lucide:gamepad-2"}
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
                    <p className="text-gray-600">Manage products and inventory</p>
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
                    <div className="flex flex-col gap-4 w-full">
                        <h2 className="text-lg font-semibold">Products</h2>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                                placeholder="Search products..."
                                value={productSearchQuery}
                                onValueChange={setProductSearchQuery}
                                startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400"/>}
                            />
                            <Select
                                placeholder="Filter by category"
                                value={productCategoryFilter}
                                onSelectionChange={(keys) => setProductCategoryFilter(Array.from(keys)[0] as string || "")}
                                className="min-w-48 w-48"
                            >

                                {[(<SelectItem key="" textValue="">All Categories</SelectItem>), ...categories.map((category) => (
                                    <SelectItem key={category.id} textValue={category.name}>
                                        {category.name}
                                    </SelectItem>
                                ))]}
                            </Select>
                            <Select
                                placeholder="Filter by status"
                                value={productStatusFilter}
                                onSelectionChange={(keys) => setProductStatusFilter(Array.from(keys)[0] as string || "")}
                                className="min-w-32 w-48"
                            >
                                <SelectItem key="" textValue="">All Status</SelectItem>
                                <SelectItem key="active" textValue="active">Active</SelectItem>
                                <SelectItem key="inactive" textValue="inactive">Inactive</SelectItem>
                            </Select>
                        </div>
                        <div className="text-sm text-gray-500">
                            Showing {paginatedProducts.length} of {filteredProducts.length} products
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="lg"/>
                        </div>
                    ) : (
                        <>
                            <Table aria-label="Products table" removeWrapper>
                                <TableHeader>
                                    <TableColumn width={64}>IMAGE</TableColumn>
                                    <TableColumn>NAME</TableColumn>
                                    <TableColumn>SKU</TableColumn>
                                    <TableColumn>CATEGORY</TableColumn>
                                    <TableColumn>PRICE</TableColumn>
                                    <TableColumn>STATUS</TableColumn>
                                    <TableColumn width={64} hideHeader>ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {paginatedProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <div className="w-[5rem] h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                                    {product.image_url ? (
                                                        <Image
                                                            src={`${product.image_url}?v=${Date.now()}`}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            radius={"md"}
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
                                            <TableCell>{getCategoryName(product.category_id)}</TableCell>
                                            <TableCell>${product.price?.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Chip color={getActiveStatusColor(product.is_active ?? false)} variant="flat" size="sm">
                                                    {product.is_active ? "Active" : "Inactive"}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Tooltip content={"Edit Product"}>
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            color="primary"
                                                            isIconOnly
                                                            onPress={() => openEditModal(product)}
                                                        >
                                                            <Icon icon="lucide:edit" className="w-4 h-4"/>
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip content={product.is_active ? "Deactivate Product" : "Activate Product"}>
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            color={product.is_active ? "warning" : "success"}
                                                            isIconOnly
                                                            onPress={() => handleToggleActive(product)}
                                                        >
                                                            <Icon icon={product.is_active ? "lucide:eye-off" : "lucide:eye"} className="w-4 h-4"/>
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip content={"Delete Product"}>
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            color="danger"
                                                            isIconOnly
                                                            onPress={() => openDeleteModal(product)}
                                                        >
                                                            <Icon icon="lucide:trash" className="w-4 h-4"/>
                                                        </Button>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {productTotalPages > 1 && (
                                <div className="flex justify-center mt-4">
                                    <Pagination
                                        loop
                                        isCompact
                                        showControls
                                        page={productPage}
                                        total={productTotalPages}
                                        onChange={setProductPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>

            {/* Product Modal (Create) */}
            <CreateProductModal
                mode="create"
                isOpen={isCreateOpen}
                onOpenChange={onCreateOpenChange}
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onCreateProduct={handleCreateProduct}
                onImageSelect={handleImageSelect}
                actionLoading={actionLoading}
                uploadingImage={uploadingImage || !!pendingNewProductImage}
            />

            {/* Product Modal (Edit) */}
            <CreateProductModal
                mode="edit"
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
                    <div className="flex flex-col gap-4 w-full">
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
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                                placeholder="Search categories..."
                                value={categorySearchQuery}
                                onValueChange={setCategorySearchQuery}
                                startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400"/>}
                                className="flex-1"
                            />
                        </div>
                        <div className="text-sm text-gray-500">
                            Showing {paginatedCategories.length} of {filteredCategories.length} categories
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="lg"/>
                        </div>
                    ) : (
                        <>
                            <Table aria-label="Categories table" removeWrapper>
                                <TableHeader>
                                    <TableColumn width={64} maxWidth={64} hideHeader>ICON</TableColumn>
                                    <TableColumn>NAME</TableColumn>
                                    <TableColumn width={64} maxWidth={64} hideHeader>ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {paginatedCategories.map((category) => (
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
                            {categoryTotalPages > 1 && (
                                <div className="flex justify-center mt-4">
                                    <Pagination
                                        loop
                                        isCompact
                                        showControls
                                        page={categoryPage}
                                        total={categoryTotalPages}
                                        onChange={setCategoryPage}
                                    />
                                </div>
                            )}
                        </>
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
