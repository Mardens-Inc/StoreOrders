/**
 * Represents a store order record with detailed information about the order.
 */
export interface StoreOrderRecordDto
{
    /** Unique identifier for the order */
    id: string;
    /** Order number */
    order_number: string;
    /** User ID associated with the order */
    user_id: number;
    /** Store ID associated with the order */
    store_id: number;
    /** Current status of the order */
    status: StoreOrderStatus | string; // backend returns string
    /** Total amount for the order */
    total_amount: number;
    /** Optional notes for the order */
    notes?: string | null;
    /** Date and time when the order was created */
    created_at: string; // ISO timestamp
    /** Date and time when the order was updated */
    updated_at: string; // ISO timestamp
    /** Date and time when the status was changed to pending */
    status_changed_to_pending?: string | null; // ISO timestamp
    /** Date and time when the status was changed to completed */
    status_changed_to_completed?: string | null; // ISO timestamp
}

export enum StoreOrderStatus
{
    Pending = "Pending",
    Shipped = "Shipped",
    Delivered = "Delivered",
}

/** Order item (basic) */
export interface OrderItemRecordDto
{
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at: string; // ISO timestamp
}

/** Order item with product fields (flattened) */
export interface OrderItemWithProductDto extends OrderItemRecordDto
{
    product_name: string;
    product_sku: string;
    product_image_url?: string | null;
}

/** Combined order with its items (flattened order fields + items array) */
export interface OrderWithItemsDto extends StoreOrderRecordDto
{
    items: OrderItemWithProductDto[];
}

/** Represents an option for a store, such as a pickup location or delivery option */
export interface StoreOption
{
    /** Unique identifier for the option */
    id: string;
    /** Optional city name for the store option */
    city?: string | null;
    /** Optional address for the store option */
    address?: string | null;
}


export type DisableUserRequest = {
    "user_id": string,
    "reason": string,
    "expiration": Date | null
}

export type DisabledUser = {
    "disabled_at": string,
    "disabled_by": string,
} & DisableUserRequest;

export type User =
    {
        id: string;
        email: string;
        role: "store" | "admin";
        store_id?: string;
        created_at: string;
        is_disabled?: DisabledUser | null;
    }

export type  Store =
    {
        id: string;
        city?: string;
        address?: string;
    }

export type CreateUserRequest =
    {
        email: string;
        role: "store" | "admin";
        store_id?: string;
    }