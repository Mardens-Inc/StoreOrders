import $ from "jquery";

export interface Store
{
    id: number;
    name: string;
    address: string;
    images: {
        "150"?: string;
        "300"?: string;
        "576"?: string;
        "768"?: string;
        "992"?: string;
        "1024"?: string;
        "1100"?: string;
        "1440"?: string;
        "1536"?: string;
        "1600"?: string;
        "1900"?: string;
        "1983"?: string;
        "2048"?: string;
        "2185"?: string;
        "2200"?: string;
        "2300"?: string;
        "2560"?: string;
        "2800"?: string;
    };
}

export default class StoreManagement
{
    static async getStores(): Promise<Store[]>
    {
        const stores = await $.get("https://lib.mardens.com/stores/") as Store[];
        return stores.map((store, index) => ({...store, id: index}));
    }
}