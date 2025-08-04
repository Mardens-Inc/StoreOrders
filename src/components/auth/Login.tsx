import React, {useState} from "react";
import {Navigate} from "react-router-dom";
import {Button, Card, CardBody, CardHeader, Divider, Form, Input} from "@heroui/react";
import {useAuth} from "../../providers/AuthProvider";

const Login: React.FC = () =>
{
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const {login, isAuthenticated} = useAuth();

    if (isAuthenticated)
    {
        return <Navigate to="/app" replace/>;
    }

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try
        {
            const success = await login(email, password);
            if (!success)
            {
                setError("Invalid credentials. Please try again.");
            }
        } catch (err)
        {
            setError("An error occurred. Please try again.");
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
                            placeholder="Enter your email"
                            value={email}
                            onValueChange={setEmail}
                            isRequired
                            variant="bordered"
                            classNames={{
                                input: "text-sm",
                                label: "text-sm font-medium"
                            }}
                        />

                        <Input
                            type="password"
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
                        />

                        {error && (
                            <div className="text-red-500 text-sm text-center">{error}</div>
                        )}

                        <Button
                            type="submit"
                            color="primary"
                            size="lg"
                            className="w-full"
                            isLoading={isLoading}
                            isDisabled={!email || !password}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </Form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            For demo purposes, enter any email and password to continue
                        </p>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default Login;
