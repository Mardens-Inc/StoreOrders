import React, {useState} from "react";
import {Navigate} from "react-router-dom";
import {Button, Card, CardBody, CardHeader, Divider, Form, Input, Tooltip} from "@heroui/react";
import {useAuth} from "../../providers/AuthProvider";
import {Icon} from "@iconify-icon/react";

const Login: React.FC = () =>
{
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const {login, isAuthenticated, isLoading: authLoading} = useAuth();

    if (authLoading)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated)
    {
        return <Navigate to="/app" replace/>;
    }

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Validate email domain
        if (!email.endsWith("@mardens.com"))
        {
            setError("Please use your @mardens.com email address.");
            setIsLoading(false);
            return;
        }

        try
        {
            const success = await login(email, password);
            if (!success)
            {
                setError("Invalid credentials. Please check your email and password.");
            }
        } catch (err)
        {
            console.error("Login error:", err);
            setError("An error occurred during login. Please try again.");
        } finally
        {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-col items-center space-y-2 pb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">M</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Mardens Store Portal</h1>
                    <p className="text-gray-600 text-center">Sign in to access the internal ordering system</p>
                </CardHeader>

                <Divider/>

                <CardBody className="pt-6">
                    <Form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="email"
                            label="Email"
                            placeholder="your.name@mardens.com"
                            value={email}
                            onValueChange={setEmail}
                            isRequired
                            variant="bordered"
                            description="Use your @mardens.com email address"
                            classNames={{
                                input: "text-sm",
                                label: "text-sm font-medium"
                            }}
                        />

                        <Input
                            type={showPassword ? "text" : "password"}
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onValueChange={setPassword}
                            isRequired
                            variant="bordered"
                            classNames={{
                                input: "text-sm",
                                label: "text-sm font-medium"
                            }}
                            endContent={
                                <Tooltip content={`${showPassword ? "Hide" : "Show"} password`}>
                                    <Button
                                        variant={"light"}
                                        isIconOnly
                                        onPress={() => setShowPassword(prev => !prev)}
                                    >
                                        <Icon icon={showPassword ? "mage:eye-off" : "mage:eye-fill"}/>
                                    </Button>
                                </Tooltip>
                            }
                        />

                        {error && (
                            <div className="p-3 rounded-md bg-red-50 border border-red-200 w-full">
                                <div className="text-red-700 text-sm">{error}</div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            color="primary"
                            size="lg"
                            className="w-full"
                            isLoading={isLoading}
                            isDisabled={!email || !password || isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </Form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500 mb-2">
                            Need help accessing your account?
                        </p>
                        <p className="text-xs text-gray-400">
                            Contact your system administrator
                        </p>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default Login;
