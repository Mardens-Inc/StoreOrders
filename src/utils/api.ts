// API utility for making authenticated requests
import {Category} from "../components/pages/Categories.tsx";
import {Product} from "../providers/CartProvider.tsx";
import {StoreOrderRecordDto} from "./types.ts";
import {OrderWithItemsDto} from "./types.ts";

const API_BASE_URL = "/api";

export interface ApiResponse<T = any>
{
    success: boolean;
    data?: T;
    count?: number;
    error?: string;
    message?: string;
}

class ApiClient
{
    private getAuthHeaders(): HeadersInit
    {
        const token = localStorage.getItem("auth_token");
        return {
            "Content-Type": "application/json",
            ...(token && {"Authorization": `Bearer ${token}`})
        };
    }

    private async handleResponse<T>(response: Response): Promise<T>
    {
        if (!response.ok)
        {
            if (response.status === 401)
            {
                // Token expired or invalid, logout user
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_refresh_token");
                localStorage.removeItem("auth_user");
                window.location.href = "/";
                throw new Error("Authentication required");
            }

            const errorData = await response.json().catch(() => ({error: "Request failed"}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    async get<T>(endpoint: string): Promise<T>
    {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "GET",
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<T>(response);
    }

    async post<T>(endpoint: string, data?: any): Promise<T>
    {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: data ? JSON.stringify(data) : undefined
        });
        return this.handleResponse<T>(response);
    }

    async put<T>(endpoint: string, data?: any): Promise<T>
    {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "PUT",
            headers: this.getAuthHeaders(),
            body: data ? JSON.stringify(data) : undefined
        });
        return this.handleResponse<T>(response);
    }

    async delete<T>(endpoint: string): Promise<T>
    {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "DELETE",
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<T>(response);
    }
}

export const apiClient = new ApiClient();

// Specific API functions
export const authApi = {
    login: (email: string, password: string) =>
        apiClient.post("/auth/login", {email, password}),

    register: (email: string, password: string, role: "store" | "admin", store_id?: string) =>
        apiClient.post("/auth/register", {email, password, role, store_id}),

    me: () => apiClient.get("/auth/me"),

    refresh: (refresh_token: string) =>
        apiClient.post("/auth/refresh", {refresh_token}),

    // User management endpoints (admin only)
    getUsers: () => apiClient.get<ApiResponse>("/auth/users"),

    updateUser: (userId: string, userData: any) =>
        apiClient.put<ApiResponse>(`/auth/users/${userId}`, userData),

    deleteUser: (userId: string) =>
        apiClient.delete<ApiResponse>(`/auth/users/${userId}`)
};

export const ordersApi = {
    getOrders: () => apiClient.get<ApiResponse<StoreOrderRecordDto[]>>("/orders"),

    getStoreOrders: (storeId: string) => apiClient.get<ApiResponse<StoreOrderRecordDto[]>>(`/orders/store/${storeId}`),

    getOrder: (orderId: string) => apiClient.get<ApiResponse<OrderWithItemsDto>>(`/orders/${orderId}`),

    createOrder: (order: any) => apiClient.post<ApiResponse<OrderWithItemsDto>>("/orders", order),

    updateOrderStatus: (orderId: string, status: string, notes?: string) =>
        apiClient.put<ApiResponse<OrderWithItemsDto>>(`/orders/${orderId}/status`, {status, notes}),

    addToCart: (productId: string, quantity: number) =>
        apiClient.post<ApiResponse>("/orders/cart/add", {product_id: productId, quantity})
};

export const productsApi = {
    getProducts: (filters?: any) =>
    {
        const params = new URLSearchParams(filters);
        return apiClient.get<ApiResponse<Product[]>>(`/products?${params}`);
    },

    getProduct: (productId: string) => apiClient.get<ApiResponse>(`/products/${productId}`),

    getProductsByCategory: (categoryId: string) =>
        apiClient.get<ApiResponse>(`/products/category/${categoryId}`),

    // Admin only - Product Management
    createProduct: (product: any) => apiClient.post<ApiResponse>("/products/admin", product),

    updateProduct: (productId: string, product: any) =>
        apiClient.put<ApiResponse>(`/products/admin/${productId}`, product),

    deleteProduct: (productId: string) =>
        apiClient.delete<ApiResponse>(`/products/admin/${productId}`),

    updateProductStock: (productId: string, quantity: number) =>
        apiClient.put<ApiResponse>(`/products/admin/${productId}`, {stock_quantity: quantity})
};

export const categoriesApi = {
    getCategories: () => apiClient.get<ApiResponse>("/categories"),

    getCategory: (categoryId: string) => apiClient.get<ApiResponse<Category>>(`/categories/${categoryId}`),

    // Admin only
    createCategory: (category: any) => apiClient.post<ApiResponse>("/categories", category),

    updateCategory: (categoryId: string, category: any) =>
        apiClient.put<ApiResponse>(`/categories/${categoryId}`, category),

    deleteCategory: (categoryId: string) =>
        apiClient.delete<ApiResponse>(`/categories/${categoryId}`)
};

export const storesApi = {
    getStores: (filters?: Record<string, string>) => {
        const params = filters ? `?${new URLSearchParams(filters)}` : "";
        return apiClient.get<ApiResponse>(`/stores${params}`);
    },
    getStore: (storeId: string) => apiClient.get<ApiResponse>(`/stores/${storeId}`)
};
