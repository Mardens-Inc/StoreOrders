import {createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState} from "react";
import {Product} from "../ts/Products.ts";

export interface CartItem extends Product
{
    quantity: number;
}

interface CartContextType
{
    cart: CartItem[];
    setCart: Dispatch<SetStateAction<CartItem[]>>;
    addProduct: (product: Product, quantity: number) => void;
    removeProduct: (product: Product) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({children}: { children: ReactNode })
{
    const [cart, setCart] = useState<CartItem[]>(() =>
    {
        const cart = localStorage.getItem("cart");
        return cart ? JSON.parse(cart) : [];
    });

    useEffect(() =>
    {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    return (
        <CartContext.Provider value={
            {
                cart, setCart,
                addProduct: (product: Product, quantity: number) =>
                {
                    const item = cart.find((item) => item.id === product.id);
                    if (item)
                    {
                        item.quantity += quantity;
                        setCart([...cart]);
                    } else
                    {
                        setCart([...cart, {...product, quantity}]);
                    }
                },
                removeProduct: (product: Product) =>
                {
                    setCart(cart.filter((item) => item.id !== product.id));
                },
                clearCart: () =>
                {
                    setCart([]);
                }
            }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextType
{
    const context = useContext(CartContext);
    if (!context)
    {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}