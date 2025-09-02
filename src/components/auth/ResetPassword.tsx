import React, {useState, useEffect} from "react";
import {Button, Card, CardBody, CardHeader, Divider, Form, Input, Link, Tooltip} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useSearchParams, useNavigate} from "react-router-dom";

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token] = useState(searchParams.get('token') || "");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token.");
        }
    }, [token]);

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];
        if (password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        }
        if (!/[A-Z]/.test(password)) {
            errors.push("Password must contain at least one uppercase letter");
        }
        if (!/[a-z]/.test(password)) {
            errors.push("Password must contain at least one lowercase letter");
        }
        if (!/[0-9]/.test(password)) {
            errors.push("Password must contain at least one number");
        }
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        // Validate password strength
        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            setError(passwordErrors.join(". "));
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    new_password: newPassword
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess(true);
                // remove authentication token from local storage
                localStorage.removeItem("auth_token");

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            } else {
                setError(data.error || "An error occurred. Please try again.");
            }
        } catch (err) {
            console.error("Reset password error:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="flex flex-col items-center space-y-2 pb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                            <Icon icon="lucide:check-circle" className="w-8 h-8 text-green-600"/>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Password Updated</h1>
                    </CardHeader>

                    <Divider/>

                    <CardBody className="pt-6">
                        <div className="text-center space-y-4">
                            <p className="text-gray-600">
                                Your password has been successfully updated. You can now log in with your new password.
                            </p>
                            <p className="text-sm text-gray-500">
                                Redirecting to login page in 3 seconds...
                            </p>
                            <Button
                                color="primary"
                                onPress={() => navigate("/login")}
                            >
                                Go to Login
                            </Button>
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
                    <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
                    <p className="text-gray-600 text-center">
                        Enter your new password below
                    </p>
                </CardHeader>

                <Divider/>

                <CardBody className="pt-6">
                    <Form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type={showPassword ? "text" : "password"}
                            label="New Password"
                            placeholder="Enter your new password"
                            value={newPassword}
                            onValueChange={setNewPassword}
                            isRequired
                            variant="bordered"
                            description="Must be at least 8 characters with uppercase, lowercase, and number"
                            autoComplete="new-password webauthn"
                            classNames={{
                                input: "text-sm",
                                label: "text-sm font-medium"
                            }}
                            endContent={
                                <Tooltip content={`${showPassword ? "Hide" : "Show"} password`}>
                                    <Button
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        variant={"light"}
                                        isIconOnly
                                        onPress={() => setShowPassword(prev => !prev)}
                                    >
                                        <Icon icon={showPassword ? "mage:eye-off" : "mage:eye-fill"}/>
                                    </Button>
                                </Tooltip>
                            }
                        />

                        <Input
                            type={showConfirmPassword ? "text" : "password"}
                            label="Confirm Password"
                            placeholder="Confirm your new password"
                            value={confirmPassword}
                            onValueChange={setConfirmPassword}
                            isRequired
                            variant="bordered"
                            classNames={{
                                input: "text-sm",
                                label: "text-sm font-medium"
                            }}
                            endContent={
                                <Tooltip content={`${showConfirmPassword ? "Hide" : "Show"} password`}>
                                    <Button
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        variant={"light"}
                                        isIconOnly
                                        onPress={() => setShowConfirmPassword(prev => !prev)}
                                    >
                                        <Icon icon={showConfirmPassword ? "mage:eye-off" : "mage:eye-fill"}/>
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
                            isDisabled={!newPassword || !confirmPassword || isLoading || !token}
                        >
                            {isLoading ? "Updating..." : "Update Password"}
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

export default ResetPassword;
