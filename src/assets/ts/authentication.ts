export type UserProfile = {
    username: string;
    admin: boolean;
    token: string;
};

export type LoginResponse = {
    success: boolean;
    message: string;
    token?: string;
};

/**
 * Represents a class for authentication.
 * @class
 */
export default class Authentication
{
    apiUrl: string;
    debugMode: boolean;
    isLoggedIn: boolean;
    token: string | null;

    constructor(debug: boolean = false)
    {
        this.apiUrl = debug ? "http://auth.local/auth/" : "https://lib.mardens.com/auth/";
        this.debugMode = debug;

        this.isLoggedIn = false;

        try
        {
            this.token = document.cookie
                .split(";")
                .find((row) => row.trim().startsWith("token="))
                ?.trim()
                .slice(6) ?? null;
        } catch (e)
        {
            this.token = null;
        }
    }

    /**
     * Authenticates the user by sending the provided username and password
     * to the server and returns the response.
     *
     * @param {string} username - The username of the user attempting to log in.
     * @param {string} password - The password of the user attempting to log in.
     * @param {number} [expiration=-1] - Optional expiration time for the generated cookies. Defaults to -1.
     * @return {Promise<LoginResponse>} A promise that resolves to the server's response,
     *                                  which includes a success flag and a token if authentication was successful.
     * @throws Will throw an error if the login attempt fails due to network issues or server errors.
     */
    public async login(username: string, password: string, expiration: number = -1): Promise<LoginResponse>
    {
        const apiURL = this.apiUrl;

        let response: any, data: any;
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);
        try
        {
            response = await fetch(apiURL, {
                method: "POST",
                body: formData
            });

            data = await response.json();
        } catch (err)
        {
            throw err;
        }

        if (data.success && data.token)
        {
            this.generateCookies(data.token, expiration);
            return data;
        } else
        {
            return data;
        }
    }

    /**
     * Logs in a user with a token.
     *
     * @param {string} token - The token to be used for authentication.
     * @param {number} [expiration=-1] - The expiration time for the generated cookies.
     * @returns {Promise<JSON>} - A Promise that resolves to the response data in JSON format.
     * @throws {Error} - Throws an error if the login process fails.
     */
    public async loginWithToken(token: string, expiration: number = -1): Promise<LoginResponse>
    {
        const formData = new FormData();
        formData.append("token", token);

        try
        {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (response.ok)
            {
                if (data.success)
                {
                    this.generateCookies(token, expiration);
                }
            } else
            {
                if (!data.message)
                {
                    data.message = "An unknown error occurred.";
                }
                throw new Error(JSON.stringify(data));
            }

            return data;
        } catch (error)
        {
            console.error(error);
            throw error;
        }
    }


    /**
     * Logs in the user with the token obtained from the cookie.
     *
     * @param {number} expiration - The expiration time of the token in minutes. Default is -1 (no expiration).
     * @return {Promise<JSON | boolean>} - A promise that resolves with JSON data if the login is successful, false otherwise.
     */
    public async loginWithTokenFromCookie(expiration: number = -1): Promise<LoginResponse>
    {
        return this.token === null ? {success: false, message: "No token was found in the cookies."} : await this.loginWithToken(this.token, expiration);
    }

    /**
     * Logout the user and clear the token cookie.
     *
     * @return {void}
     */
    public logout(): void
    {
        document.cookie = `token=; path=/; domain=.${window.location.hostname}; samesite=strict; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        this.isLoggedIn = false;
    }

    /**
     * Generates cookies for the given token.
     *
     * @param {string} token - The token used for generating the cookies.
     * @param {number} [days=-1] - The number of days the cookie should be valid for. Default value is -1.
     *
     * @returns {void}
     */
    public generateCookies(token: string, days: number = -1): void
    {
        if (days <= 0)
        {
            document.cookie = `token=${token}; path=/; domain=.${window.location.hostname}; samesite=strict`;
        } else
        {
            let expire = new Date();
            expire.setDate(expire.getDate() + days);
            document.cookie = `token=${token}; path=/; domain=.${window.location.hostname}; samesite=strict; expires=${expire.toUTCString()}`;
        }
        this.token = token;
        this.isLoggedIn = true;
    }

    /**
     * Retrieves the user profile from the logged in user's token.
     *
     * @throws {Error} If the user is not logged in or if the token is invalid.
     * @returns {UserProfile} The user profile parsed from the token.
     */
    public getUserProfile(): UserProfile
    {
        if (!this.isLoggedIn || this.token === "" || this.token === undefined) throw new Error("User is not logged in");
        return JSON.parse(atob(this.token!));
    }
}
