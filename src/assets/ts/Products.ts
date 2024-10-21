export interface Product
{
    id: string;
    name: string;
    price: number;
    image: string;
}

export enum ProductCategory{
    Food = "Food",
    Hardware = "Hardware",
    Health = "Health",
    Clothing = "Clothing",
}