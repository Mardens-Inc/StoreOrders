import React from "react";
import {Avatar, Badge, Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Navbar, NavbarContent, NavbarItem} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useAuth} from "../../providers/AuthProvider";
import {useCart} from "../../providers/CartProvider";

const Header: React.FC = () =>
{
    const {user, logout} = useAuth();
    const {getTotalItems, setIsOpen} = useCart();

    const handleLogout = () =>
    {
        logout();
    };

    const getUserDisplayName = () =>
    {
        if (!user) return "";
        // Extract name from email (e.g., "john.doe@mardens.com" -> "John Doe")
        const emailPart = user.email.split("@")[0];
        return emailPart.split(".").map(part =>
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(" ");
    };

    const getRoleColor = (role: string) =>
    {
        switch (role)
        {
            case "admin":
                return "danger";
            case "store":
                return "primary";
            default:
                return "default";
        }
    };

    return (
        <Navbar className="border-b bg-white" maxWidth="full">
            <NavbarContent className="flex-1">
                {/* Search Bar */}
                <NavbarItem className="flex-1 max-w-lg">
                    <Input
                        placeholder="Search products..."
                        startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400"/>}
                        variant="bordered"
                        className="w-full"
                        classNames={{
                            input: "text-sm",
                            inputWrapper: "bg-gray-50 border-gray-200"
                        }}
                    />
                </NavbarItem>
            </NavbarContent>

            <NavbarContent justify="end">
                {user?.role === "store" &&
                        <>
                            {/* Cart Button */}
                            <NavbarItem>
                                <Badge
                                    content={getTotalItems()}
                                    color="primary"
                                    isInvisible={getTotalItems() === 0}
                                    shape="circle"
                                >
                                    <Button
                                        variant="light"
                                        isIconOnly
                                        onPress={() => setIsOpen(true)}
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        <Icon icon="lucide:shopping-cart" className="w-5 h-5"/>
                                    </Button>
                                </Badge>
                            </NavbarItem>
                        </>
                }
                {/* Notifications */}
                <NavbarItem>
                    <Button
                        variant="light"
                        isIconOnly
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <Icon icon="lucide:bell" className="w-5 h-5"/>
                    </Button>
                </NavbarItem>

                {/* User Menu */}
                <NavbarItem>
                    <Dropdown>
                        <DropdownTrigger>
                            <div className="flex items-center gap-2 cursor-pointer">
                                <Avatar
                                    name={getUserDisplayName()[0].toUpperCase()}
                                    size="sm"
                                    className="bg-blue-500 text-white"
                                />
                                <div className="hidden md:flex flex-col items-start">
                                    <span className="text-sm font-medium">{getUserDisplayName()}</span>
                                    <Chip
                                        size="sm"
                                        color={getRoleColor(user?.role || "")}
                                        variant="flat"
                                        className="text-xs"
                                    >
                                        {user?.role === "admin" ? "Administrator" : "Store User"}
                                    </Chip>
                                </div>
                            </div>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="User menu">
                            <DropdownItem key="profile" className="h-14 gap-2">
                                <div className="flex flex-col">
                                    <p className="font-semibold">{getUserDisplayName()}</p>
                                    <p className="text-small text-gray-500">{user?.email}</p>
                                    <Chip
                                        size="sm"
                                        color={getRoleColor(user?.role || "")}
                                        variant="flat"
                                        className="w-fit mt-1"
                                    >
                                        {user?.role === "admin" ? "Administrator" : "Store User"}
                                    </Chip>
                                </div>
                            </DropdownItem>
                            <DropdownItem key="settings" startContent={<Icon icon="lucide:settings"/>}>
                                Settings
                            </DropdownItem>
                            <DropdownItem key="help" startContent={<Icon icon="lucide:help-circle"/>}>
                                Help & Support
                            </DropdownItem>
                            <DropdownItem
                                key="logout"
                                color="danger"
                                startContent={<Icon icon="lucide:log-out"/>}
                                onPress={handleLogout}
                            >
                                Sign Out
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </NavbarItem>
            </NavbarContent>
        </Navbar>
    );
};

export default Header;
