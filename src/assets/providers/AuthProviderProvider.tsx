import {createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState} from "react";
import Authentication, {LoginResponse} from "../ts/authentication.ts";

interface AuthProviderContextType
{
    auth: Authentication;
    isLoggedIn: boolean;
    setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
    logout: () => void;

}

const AuthProviderContext = createContext<AuthProviderContextType | undefined>(undefined);

export function AuthProviderProvider({children}: { children: ReactNode })
{
    const [auth] = useState(() => new Authentication());
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const logout = () =>
    {
        auth.logout();
        setIsLoggedIn(false);
    };

    useEffect(() =>
    {
        auth.loginWithTokenFromCookie()
            .then((response: LoginResponse) =>
            {
                const isLoggedIn = response.success;
                setIsLoggedIn(isLoggedIn);
            });
    }, [auth]);
    return (
        <AuthProviderContext.Provider value={{auth, isLoggedIn, setIsLoggedIn, logout}}>
            {children}
        </AuthProviderContext.Provider>
    );
}

export function useAuthProvider(): AuthProviderContextType
{
    const context = useContext(AuthProviderContext);
    if (!context)
    {
        throw new Error("useAuthProvider must be used within a AuthProviderProvider");
    }
    return context;
}