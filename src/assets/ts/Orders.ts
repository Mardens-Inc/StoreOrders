import StoreManagement, {Store} from "./Stores.ts";

export interface Orders
{
    id: number,
    store: Store,
    status: OrderStatus
    week: Date,

}

export enum OrderStatus
{
    COMPLETED = "completed",
    CURRENT = "current",
    PENDING = "pending",
    CANCELLED = "cancelled",
}


export default class OrderManagement
{
    static async getOrders(): Promise<Orders[]>
    {
        const stores = await StoreManagement.getStores();
        // return $.get("/api/orders")
        return [
            {
                id: 1,
                store: stores.find((store) => store.id === 1)!,
                status: OrderStatus.COMPLETED,
                week: new Date(2022, 8, 25)
            },
            {
                id: 2,
                store: stores.find((store) => store.id === 2)!,
                status: OrderStatus.CURRENT,
                week: new Date(2022, 8, 25)
            },
            {
                id: 3,
                store: stores.find((store) => store.id === 3)!,
                status: OrderStatus.PENDING,
                week: new Date(2022, 8, 25)
            },
            {
                id: 4,
                store: stores.find((store) => store.id === 4)!,
                status: OrderStatus.CANCELLED,
                week: new Date(2022, 8, 25)
            }
        ];
    }
}


export function getWeekNumber(date: Date): number
{
    // Copy date to avoid modifying the original
    const currentDate = new Date(date.getTime());

    // Set the date to the nearest Thursday: current date + 4 - current day number
    const dayNumber = (currentDate.getDay() + 6) % 7;
    currentDate.setDate(currentDate.getDate() - dayNumber + 3);

    // Get the first Thursday of the year
    const firstThursday = new Date(currentDate.getFullYear(), 0, 4);

    // Calculate the number of days between the current date and the first Thursday
    const daysDifference = (currentDate.getTime() - firstThursday.getTime()) / (24 * 60 * 60 * 1000);

    // Calculate the week number
    return Math.round((daysDifference + 3) / 7);
}