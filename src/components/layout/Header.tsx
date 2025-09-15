import React, {useEffect, useMemo, useRef, useState} from "react";
import {Avatar, Badge, Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Navbar, NavbarContent, NavbarItem, Spinner} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useAuth} from "../../providers/AuthProvider";
import {useCart} from "../../providers/CartProvider";
import {useLayout} from "../../providers/LayoutProvider";
import {Input} from "../extension/Input.tsx";
import {authApi, ordersApi, productsApi} from "../../utils/api.ts";
import CreateProductModal from "../modals/CreateProductModal";
import EditUserModal from "../modals/EditUserModal";
import {categoriesApi, storesApi} from "../../utils/api";

const Header: React.FC = () =>
{
    const {user, logout} = useAuth();
    const {getTotalItems, setIsOpen, addToCart} = useCart();
    const {isMobileMenuOpen, setIsMobileMenuOpen, isMobile} = useLayout();

    // Product edit modal state
    const [isEditProductOpen, setIsEditProductOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [productForm, setProductForm] = useState<any>({name: "", description: "", sku: "", category_id: "", image_url: "", price: 0, bin_location: "", unit_type: 0});
    const [productCategories, setProductCategories] = useState<any[]>([]);
    const [productActionLoading, setProductActionLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // User edit modal state
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userForm, setUserForm] = useState<any>({email: "", role: "store", store_id: ""});
    const [stores, setStores] = useState<any[]>([]);
    const [userActionLoading, setUserActionLoading] = useState(false);

    const [query, setQuery] = useState("");
    const [isOpenPanel, setIsOpenPanel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [productResults, setProductResults] = useState<any[]>([]);
    const [orderResults, setOrderResults] = useState<any[]>([]);
    const [userResults, setUserResults] = useState<any[]>([]);
    const [usersUnauthorized, setUsersUnauthorized] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null as any);
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    const canAdminSetShippedOrDelivered = (order: any) =>
    {
        const s = (order.status || "").toLowerCase();
        return user?.role === "admin" && s === "pending";
    };

    const canStoreMarkDelivered = (order: any) =>
    {
        const s = (order.status || "").toLowerCase();
        return user?.role === "store" && s !== "delivered";
    };

    const updateStatus = async (order: any, status: "Shipped" | "Delivered") =>
    {
        setUpdating(prev => ({...prev, [order.id]: true}));
        try
        {
            await ordersApi.updateOrderStatus(order.id, status);
            setOrderResults(prev => prev.map(o => o.id === order.id ? {...o, status} : o));
        } catch (e)
        {
            console.error("Failed to update order status from header", e);
        } finally
        {
            setUpdating(prev => ({...prev, [order.id]: false}));
        }
    };

    const normalizeProduct = (apiProduct: any) => ({
        id: apiProduct.product?.id || apiProduct.id,
        name: apiProduct.product?.name || apiProduct.name,
        description: apiProduct.product?.description || apiProduct.description || "",
        category_id: apiProduct.product?.category_id || apiProduct.category_id || "",
        imageUrl: apiProduct.product?.image_url || apiProduct.image_url || "/api/placeholder/300/300",
        sku: apiProduct.product?.sku || apiProduct.sku || "",
        price: apiProduct.product?.price ?? apiProduct.price ?? 0,
        in_stock: apiProduct.product?.in_stock ?? apiProduct.in_stock ?? true,
        stock_quantity: apiProduct.product?.stock_quantity ?? apiProduct.stock_quantity ?? 0,
        is_active: apiProduct.product?.is_active ?? apiProduct.is_active ?? true,
        created_at: apiProduct.product?.created_at ?? apiProduct.created_at,
        updated_at: apiProduct.product?.updated_at ?? apiProduct.updated_at,
        image_url: apiProduct.product?.image_url ?? apiProduct.image_url
    });

    const handleAddToCartQuick = (p: any) =>
    {
        try
        {
            const product = normalizeProduct(p);
            addToCart(product, 1);
            setIsOpen(true);
        } catch (e)
        {
            console.error("Add to cart failed", e);
        }
    };

    const handleLogout = () =>
    {
        logout();
    };

    // Debounced global search
    useEffect(() =>
    {
        let timeout: any;
        let cancelled = false;
        const run = async () =>
        {
            if (!query.trim())
            {
                setProductResults([]);
                setOrderResults([]);
                setUserResults([]);
                setUsersUnauthorized(false);
                setLoading(false);
                return;
            }
            setLoading(true);
            setUsersUnauthorized(false);
            try
            {
                const prodPromise = productsApi.getProducts({search: query.trim(), limit: 10}).catch(() => ({data: []} as any));
                const ordersPromise = ordersApi.getOrders().catch(() => ({data: []} as any));
                const usersPromise = authApi.getUsers().catch(() =>
                {
                    // If unauthorized, mark and return empty
                    setUsersUnauthorized(true);
                    return {data: []} as any;
                });

                const [prodResp, ordersResp, usersResp] = await Promise.all([prodPromise, ordersPromise, usersPromise]);
                if (cancelled) return;

                const prods = (prodResp?.data || []).slice(0, 10);
                // Orders: filter by order_number or notes
                const allOrders = (ordersResp?.data || []);
                const filteredOrders = (allOrders as any[]).filter(o =>
                    (o.order_number || "").toLowerCase().includes(query.toLowerCase()) ||
                    (o.notes || "").toLowerCase().includes(query.toLowerCase())
                ).slice(0, 10);

                // Users: filter by email
                const allUsers = (usersResp?.data || []);
                const filteredUsers = (allUsers as any[]).filter(u =>
                    (u.email || "").toLowerCase().includes(query.toLowerCase())
                ).slice(0, 10);

                setProductResults(prods);
                setOrderResults(filteredOrders);
                setUserResults(filteredUsers);
            } catch (e)
            {
                console.error("Global search failed", e);
            } finally
            {
                if (!cancelled) setLoading(false);
            }
        };
        timeout = setTimeout(run, 300);
        return () =>
        {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [query]);

    // Close panel on outside click or Escape
    useEffect(() =>
    {
        const onClick = (e: MouseEvent) =>
        {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node))
            {
                setIsOpenPanel(false);
            }
        };
        const onKey = (e: KeyboardEvent) =>
        {
            if (e.key === "Escape") setIsOpenPanel(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () =>
        {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    const getUserDisplayName = () =>
    {
        try
        {
            if (!user) return " "; // Return a single space character so the name doesn't break layout
            // Extract name from email (e.g., "john.doe@mardens.com" -> "John Doe")
            const emailPart = user.email.split("@")[0];
            return emailPart.split(".").map(part =>
                part.charAt(0).toUpperCase() + part.slice(1)
            ).join(" ");
        } catch (e)
        {
            console.error("Error getting user display name:", e);
            return " ";
        }
    };

    const getRoleColor = (role: string) =>
    {
        switch (role)
        {
            case "admin":
                return "danger";
            case "store":
                return "primary";
            default:
                return "default";
        }
    };

    const hasAnyResults = useMemo(() =>
            (productResults.length + orderResults.length + (user?.role === "admin" && !usersUnauthorized ? userResults.length : 0)) > 0
        , [productResults, orderResults, userResults, user?.role, usersUnauthorized]);

    // @ts-ignore
    return (
        <Navbar className="border-b bg-white" maxWidth="full">
            <NavbarContent className="flex-1">
                {/* Mobile Menu Button */}
                {isMobile && (
                    <NavbarItem className="lg:hidden">
                        <Button
                            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                            variant="light"
                            isIconOnly
                            onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px]"
                        >
                            <Icon
                                icon={isMobileMenuOpen ? "lucide:x" : "lucide:menu"}
                                className="w-6 h-6"
                            />
                        </Button>
                    </NavbarItem>
                )}

                {/* Search Bar */}
                {/* @ts-ignore  */}
                <NavbarItem className="flex-1 max-w-lg" ref={containerRef}>
                    <div className="relative w-full">
                        <Input
                            ref={inputRef as any}
                            aria-label="Search"
                            placeholder="Search products, orders, users..."
                            startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400"/>}
                            variant="bordered"
                            className="w-full"
                            classNames={{
                                input: "text-sm",
                                inputWrapper: "bg-gray-50 border-gray-200"
                            }}
                            value={query}
                            onChange={(e) =>
                            {
                                setQuery(e.target.value);
                                setIsOpenPanel(true);
                            }}
                            onFocus={() => query && setIsOpenPanel(true)}
                        />

                        {isOpenPanel && query && (
                            <div
                                role="listbox"
                                aria-label="Search results"
                                className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto p-2"
                            >
                                {loading && (
                                    <div className="flex items-center gap-2 p-3 text-sm text-gray-600">
                                        <Spinner size="sm"/> Searching...
                                    </div>
                                )}

                                {!loading && !hasAnyResults && (
                                    <div className="p-3 text-sm text-gray-500">No results for "{query}"</div>
                                )}

                                {/* Products Section */}
                                {!loading && productResults.length > 0 && (
                                    <div className="py-1">
                                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Products</div>
                                        <hr className="my-1"/>
                                        <ul className="divide-y divide-gray-100">
                                            {productResults.map((p: any) => (
                                                <li key={p.id} className="py-2 px-2 hover:bg-gray-50 rounded flex items-center gap-2 cursor-default">
                                                    <Icon icon="lucide:package" className="w-4 h-4 text-gray-400"/>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                                                        <div className="text-xs text-gray-500 truncate">SKU: {p.sku}</div>
                                                    </div>
                                                    <div className="ml-auto flex items-center gap-2">
                                                        {user?.role === "store" && (
                                                            <Button size="sm" color="primary" variant="flat" onPress={() => handleAddToCartQuick(p)} startContent={<Icon icon="lucide:shopping-cart" className="w-4 h-4"/>}>
                                                                Add
                                                            </Button>
                                                        )}
                                                        {user?.role === "admin" && (
                                                            <Button size="sm" color="secondary" variant="flat" onPress={async () =>
                                                            {
                                                                setIsOpenPanel(false);
                                                                setSelectedProductId(p.id);
                                                                // fetch product details and categories lazily
                                                                try
                                                                {
                                                                    const [prodResp, catsResp] = await Promise.all([
                                                                        productsApi.getProduct(p.id).catch(() => ({data: p} as any)),
                                                                        productCategories.length === 0 ? categoriesApi.getCategories().catch(() => ({data: []} as any)) : Promise.resolve({data: productCategories} as any)
                                                                    ]);
                                                                    const prodData = (prodResp as any)?.data || p;
                                                                    const merged = {
                                                                        name: prodData.product?.name || prodData.name || "",
                                                                        description: prodData.product?.description || prodData.description || "",
                                                                        sku: prodData.product?.sku || prodData.sku || "",
                                                                        category_id: prodData.product?.category_id || prodData.category_id || "",
                                                                        image_url: prodData.product?.image_url || prodData.image_url || "",
                                                                        price: prodData.product?.price ?? prodData.price ?? 0,
                                                                        bin_location: prodData.product?.bin_location || prodData.bin_location || "",
                                                                        unit_type: (prodData.product?.unit_type ?? prodData.unit_type ?? 0)
                                                                    };
                                                                    setProductForm(merged);
                                                                    if (productCategories.length === 0) setProductCategories((catsResp as any)?.data || []);
                                                                    setIsEditProductOpen(true);
                                                                } catch (e)
                                                                {
                                                                    console.error("Failed to prepare product edit modal", e);
                                                                }
                                                            }} startContent={<Icon icon="lucide:edit" className="w-4 h-4"/>}>
                                                                Edit
                                                            </Button>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Orders Section */}
                                {!loading && orderResults.length > 0 && (
                                    <div className="py-1">
                                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Orders</div>
                                        <hr className="my-1"/>
                                        <ul className="divide-y divide-gray-100">
                                            {orderResults.map((o: any) => (
                                                <li key={o.id} className="py-2 px-2 hover:bg-gray-50 rounded flex items-center gap-2 cursor-default">
                                                    <Icon icon="lucide:receipt" className="w-4 h-4 text-gray-400"/>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">{o.order_number}</div>
                                                        <div className="text-xs text-gray-500 truncate">{o.status} • {new Date(o.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                    <div className="ml-auto flex items-center gap-2">
                                                        {canAdminSetShippedOrDelivered(o) && (
                                                            <>
                                                                <Button size="sm" color="secondary" variant="flat" isDisabled={updating[o.id]} onPress={() => updateStatus(o, "Shipped")} startContent={<Icon icon="lucide:truck" className="w-4 h-4"/>}>
                                                                    Shipped
                                                                </Button>
                                                                <Button size="sm" color="success" variant="flat" isDisabled={updating[o.id]} onPress={() => updateStatus(o, "Delivered")} startContent={<Icon icon="lucide:package-check" className="w-4 h-4"/>}>
                                                                    Delivered
                                                                </Button>
                                                            </>
                                                        )}
                                                        {canStoreMarkDelivered(o) && (
                                                            <Button size="sm" color="success" variant="flat" isDisabled={updating[o.id]} onPress={() => updateStatus(o, "Delivered")} startContent={<Icon icon="lucide:package-check" className="w-4 h-4"/>}>
                                                                Mark Delivered
                                                            </Button>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Users Section (admin only) */}
                                {!loading && user?.role === "admin" && !usersUnauthorized && userResults.length > 0 && (
                                    <div className="py-1">
                                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">Users</div>
                                        <hr className="my-1"/>
                                        <ul className="divide-y divide-gray-100">
                                            {userResults.map((u: any) => (
                                                <li key={u.id} className="py-2 px-2 hover:bg-gray-50 rounded flex items-center gap-2 cursor-default">
                                                    <Icon icon="lucide:user" className="w-4 h-4 text-gray-400"/>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">{u.email}</div>
                                                        <div className="text-xs text-gray-500 truncate">{(u.role || "").toString().toUpperCase()}</div>
                                                    </div>
                                                    <div className="ml-auto flex items-center gap-2">
                                                        <Button size="sm" color="secondary" variant="flat" onPress={async () =>
                                                        {
                                                            setIsOpenPanel(false);
                                                            setSelectedUser(u);
                                                            setUserForm({email: u.email, role: u.role, store_id: u.store_id || ""});
                                                            if (stores.length === 0)
                                                            {
                                                                try
                                                                {
                                                                    const resp = await storesApi.getStores();
                                                                    setStores(((resp as any)?.data) || []);
                                                                } catch (e)
                                                                {
                                                                    console.error("Failed to load stores for user edit", e);
                                                                }
                                                            }
                                                            setIsEditUserOpen(true);
                                                        }} startContent={<Icon icon="lucide:edit" className="w-4 h-4"/>}>
                                                            Edit
                                                        </Button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Users section suppressed notice (admin only) */}
                                {!loading && user?.role === "admin" && usersUnauthorized && (
                                    <div className="px-2 py-1 text-xs text-gray-400">User results hidden (insufficient permissions)</div>
                                )}
                            </div>
                        )}
                    </div>
                </NavbarItem>
            </NavbarContent>

            <NavbarContent justify="end" className="gap-2">
                {user?.role === "store" &&
                    <>
                        {/* Cart Button */}
                        <NavbarItem>
                            <Badge
                                content={getTotalItems()}
                                color="primary"
                                isInvisible={getTotalItems() === 0}
                                shape="circle"
                            >
                                <Button
                                    aria-label="Open cart"
                                    variant="light"
                                    isIconOnly
                                    onPress={() => setIsOpen(true)}
                                    className="text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px]"
                                >
                                    <Icon icon="lucide:shopping-cart" className="w-5 h-5"/>
                                </Button>
                            </Badge>
                        </NavbarItem>
                    </>
                }

                {/* User Menu */}
                <NavbarItem>
                    <Dropdown>
                        <DropdownTrigger>
                            <div className="flex items-center gap-2 cursor-pointer p-1" role="button" aria-label="Open user menu">
                                <Avatar
                                    name={getUserDisplayName()[0].toUpperCase()}
                                    size="sm"
                                    className="bg-blue-500 text-white"
                                />
                                <div className="hidden sm:flex flex-col items-start">
                                    <span className="text-sm font-medium truncate max-w-[120px]">{getUserDisplayName()}</span>
                                    <Chip
                                        size="sm"
                                        color={getRoleColor(user?.role || "")}
                                        variant="flat"
                                        className="text-xs"
                                    >
                                        {user?.role === "admin" ? "Admin" : "Store"}
                                    </Chip>
                                </div>
                            </div>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="User menu">
                            <DropdownItem key="profile" className="h-14 gap-2">
                                <div className="flex flex-col">
                                    <p className="font-semibold">{getUserDisplayName()}</p>
                                    <p className="text-small text-gray-500 truncate">{user?.email}</p>
                                    <Chip
                                        size="sm"
                                        color={getRoleColor(user?.role || "")}
                                        variant="flat"
                                        className="w-fit mt-1"
                                    >
                                        {user?.role === "admin" ? "Administrator" : "Store User"}
                                    </Chip>
                                </div>
                            </DropdownItem>
                            {/*<DropdownItem key="settings" startContent={<Icon icon="lucide:settings"/>}>*/}
                            {/*    Settings*/}
                            {/*</DropdownItem>*/}
                            {/*<DropdownItem key="help" startContent={<Icon icon="lucide:help-circle"/>}>*/}
                            {/*    Help & Support*/}
                            {/*</DropdownItem>*/}
                            <DropdownItem
                                key="logout"
                                color="danger"
                                startContent={<Icon icon="lucide:log-out"/>}
                                onPress={handleLogout}
                            >
                                Sign Out
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </NavbarItem>
            </NavbarContent>

            {/* Product Modal (Edit) */}
            <CreateProductModal
                mode="edit"
                isOpen={isEditProductOpen}
                onOpenChange={() => setIsEditProductOpen(o => !o)}
                formData={productForm}
                setFormData={setProductForm}
                categories={productCategories}
                onUpdateProduct={async () => {
                    if (!selectedProductId) return;
                    try {
                        setProductActionLoading(true);
                        await productsApi.updateProduct(selectedProductId, productForm);
                        setProductResults(prev => prev.map(pr => pr.id === selectedProductId ? { ...pr, ...productForm } : pr));
                        setIsEditProductOpen(false);
                    } catch (e) {
                        console.error("Failed to update product from header", e);
                    } finally {
                        setProductActionLoading(false);
                    }
                }}
                onImageSelect={(file: File) => {
                    try {
                        setUploadingImage(true);
                        const url = URL.createObjectURL(file);
                        setProductForm((prev: any) => ({ ...prev, image_url: url }));
                    } finally {
                        setUploadingImage(false);
                    }
                }}
                actionLoading={productActionLoading}
                uploadingImage={uploadingImage}
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={isEditUserOpen}
                onOpenChange={() => setIsEditUserOpen(o => !o)}
                formData={userForm}
                setFormData={setUserForm}
                stores={stores}
                onUpdateUser={async () =>
                {
                    if (!selectedUser) return;
                    try
                    {
                        setUserActionLoading(true);
                        await authApi.updateUser(selectedUser.id, userForm);
                        setUserResults(prev => prev.map(ur => ur.id === selectedUser.id ? {...ur, ...userForm} : ur));
                        setIsEditUserOpen(false);
                    } catch (e)
                    {
                        console.error("Failed to update user from header", e);
                    } finally
                    {
                        setUserActionLoading(false);
                    }
                }}
                actionLoading={userActionLoading}
                selectedUser={selectedUser}
            />
        </Navbar>
    );
};

export default Header;
