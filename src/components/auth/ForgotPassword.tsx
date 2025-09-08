import React, {useState} from "react";
import {Button, Card, CardBody, CardHeader, Divider, Form, Link} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useSearchParams} from "react-router-dom";
import {Input} from "../extension/Input.tsx";

const ForgotPassword: React.FC = () =>
{
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

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
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({email})
            });

            const data = await response.json();

            if (response.ok && data.success)
            {
                setSuccess(true);
            } else
            {
                setError(data.error || "An error occurred. Please try again.");
            }
        } catch (err)
        {
            console.error("Forgot password error:", err);
            setError("An error occurred. Please try again.");
        } finally
        {
            setIsLoading(false);
        }
    };

    if (success)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="flex flex-col items-center space-y-2 pb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                            <Icon icon="lucide:check-circle" className="w-8 h-8 text-green-600"/>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
                    </CardHeader>

                    <Divider/>

                    <CardBody className="pt-6">
                        <div className="text-center space-y-4">
                            <p className="text-gray-600">
                                If the email address is associated with an account in our system,
                                you will receive a password reset link shortly.
                            </p>
                            <p className="text-sm text-gray-500">
                                The reset link will expire in 1 hour for security reasons.
                            </p>
                            <Link href="/login" className="text-blue-600 hover:text-blue-800">
                                ← Back to login
                            </Link>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-col items-center space-y-2 pb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Icon icon="lucide:key" className="w-8 h-8 text-white"/>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
                    <p className="text-gray-600 text-center">
                        Enter your email address and we'll send you a link to reset your password
                    </p>
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
                            isDisabled={!email || isLoading}
                        >
                            {isLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </Form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-blue-600 hover:text-blue-800">
                            ← Back to login
                        </Link>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default ForgotPassword;
