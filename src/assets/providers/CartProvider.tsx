import {createContext, Dispatch, ReactNode, SetStateAction, useContext, useState} from "react";

interface CartContextType
{
    cart: number[];
    setCart: Dispatch<SetStateAction<number[]>>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({children}: { children: ReactNode })
{
    const [cart, setCart] = useState<number[]>([]);
    return (
        <CartContext.Provider value={{cart, setCart}}>
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