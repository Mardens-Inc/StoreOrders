import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";

interface User
{
    id: string;
    email: string;
    role: "store" | "admin";
    store_id?: string;
    created_at: string;
}

interface AuthResponse
{
    user: User;
    token: string;
    refresh_token: string;
}

interface AuthContextType
{
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () =>
{
    const context = useContext(AuthContext);
    if (context === undefined)
    {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps
{
    children: ReactNode;
}

const API_BASE_URL = "/api";

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) =>
{
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Helper function to check if a JWT token is expired
    const isTokenExpired = (token: string): boolean =>
    {
        try
        {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        } catch
        {
            return true; // If we can't parse it, consider it expired
        }
    };

    // Refresh the access token using the refresh token
    const refreshAccessToken = async (): Promise<string | null> =>
    {
        const refreshToken = localStorage.getItem("auth_refresh_token");
        if (!refreshToken)
        {
            return null;
        }

        try
        {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({refresh_token: refreshToken})
            });

            if (!response.ok)
            {
                throw new Error("Refresh failed");
            }

            const authData: AuthResponse = await response.json();

            // Update stored tokens
            setToken(authData.token);
            setUser(authData.user);
            localStorage.setItem("auth_token", authData.token);
            localStorage.setItem("auth_refresh_token", authData.refresh_token);
            localStorage.setItem("auth_user", JSON.stringify(authData.user));

            return authData.token;
        } catch (error)
        {
            console.error("Token refresh failed:", error);
            logout();
            return null;
        }
    };

    // Load user from localStorage on mount
    useEffect(() =>
    {
        const initAuth = async () =>
        {
            const savedToken = localStorage.getItem("auth_token");
            const savedUser = localStorage.getItem("auth_user");

            if (savedToken && savedUser)
            {
                try
                {
                    const parsedUser = JSON.parse(savedUser);

                    // Check if token is expired
                    if (isTokenExpired(savedToken))
                    {
                        console.log("Token expired, attempting refresh...");
                        const newToken = await refreshAccessToken();
                        if (!newToken)
                        {
                            logout();
                            setIsLoading(false);
                            return;
                        }
                        // Continue with the new token
                    } else
                    {
                        setToken(savedToken);
                        setUser(parsedUser);
                    }

                    // Validate token by calling /me endpoint
                    await validateToken(token || savedToken);
                } catch (error)
                {
                    console.error("Error loading saved auth data:", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const validateToken = async (authToken: string) =>
    {
        try
        {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    "Authorization": `Bearer ${authToken}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok)
            {
                if (response.status === 401)
                {
                    // Token is invalid, try to refresh
                    console.log("Token invalid, attempting refresh...");
                    const newToken = await refreshAccessToken();
                    if (!newToken)
                    {
                        throw new Error("Token refresh failed");
                    }
                    return; // Exit early, refreshAccessToken already updated the user
                }
                throw new Error(`Token validation failed: ${response.status}`);
            }

            const userData = await response.json();
            setUser({
                id: userData.id,
                email: userData.email,
                role: userData.role,
                store_id: userData.store_id,
                created_at: userData.created_at || new Date().toISOString()
            });
        } catch (error)
        {
            console.error("Token validation failed:", error);
            logout();
        }
    };

    const login = async (email: string, password: string): Promise<boolean> =>
    {
        try
        {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({email, password})
            });

            if (!response.ok)
            {
                const errorData = await response.json();
                console.error("Login failed:", errorData);
                return false;
            }

            const authData: AuthResponse = await response.json();

            // Store auth data
            setUser(authData.user);
            setToken(authData.token);

            // Persist to localStorage
            localStorage.setItem("auth_token", authData.token);
            localStorage.setItem("auth_refresh_token", authData.refresh_token);
            localStorage.setItem("auth_user", JSON.stringify(authData.user));

            return true;
        } catch (error)
        {
            console.error("Login error:", error);
            return false;
        } finally
        {
            setIsLoading(false);
        }
    };

    const logout = () =>
    {
        setUser(null);
        setToken(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_refresh_token");
        localStorage.removeItem("auth_user");
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading,
        token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
