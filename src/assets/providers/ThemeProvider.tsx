import {createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState} from "react";
import {applyTheme, getCurrentTheme, Theme} from "../ts/Theme.ts";

interface ThemeContextType
{
    theme: Theme;
    setTheme: Dispatch<SetStateAction<Theme>>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({children}: { children: ReactNode })
{
    const [theme, setTheme] = useState<Theme>(getCurrentTheme());
    useEffect(() =>
    {
        applyTheme(theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{theme, setTheme}}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType
{
    const context = useContext(ThemeContext);
    if (!context)
    {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}