import React from "react";
import {Avatar, Badge, Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Navbar, NavbarContent, NavbarItem} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useAuth} from "../../providers/AuthProvider";
import {useCart} from "../../providers/CartProvider";
import {useLayout} from "../../providers/LayoutProvider";

const Header: React.FC = () =>
{
    const {user, logout} = useAuth();
    const {getTotalItems, setIsOpen} = useCart();
    const {isMobileMenuOpen, setIsMobileMenuOpen, isMobile} = useLayout();

    const handleLogout = () =>
    {
        logout();
    };

    const getUserDisplayName = () =>
    {
        try
        {
            if (!user) return " "; // Return a single space character so the name doesn't break layout
            // Extract name from email (e.g., "john.doe@mardens.com" -> "John Doe")
            const emailPart = user.email.split("@")[0];
            return emailPart.split(".").map(part =>
                part.charAt(0).toUpperCase() + part.slice(1)
            ).join(" ");
        } catch (e)
        {
            console.error("Error getting user display name:", e);
            return " ";
        }
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
                {/* Mobile Menu Button */}
                {isMobile && (
                    <NavbarItem className="lg:hidden">
                        <Button
                            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                            variant="light"
                            isIconOnly
                            onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px]"
                        >
                            <Icon
                                icon={isMobileMenuOpen ? "lucide:x" : "lucide:menu"}
                                className="w-6 h-6"
                            />
                        </Button>
                    </NavbarItem>
                )}

                {/* Search Bar */}
                <NavbarItem className="flex-1 max-w-lg">
                    <Input
                        aria-label="Search products"
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

            <NavbarContent justify="end" className="gap-2">
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
                                    aria-label="Open cart"
                                    variant="light"
                                    isIconOnly
                                    onPress={() => setIsOpen(true)}
                                    className="text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px]"
                                >
                                    <Icon icon="lucide:shopping-cart" className="w-5 h-5"/>
                                </Button>
                            </Badge>
                        </NavbarItem>
                    </>
                }

                {/* User Menu */}
                <NavbarItem>
                    <Dropdown>
                        <DropdownTrigger>
                            <div className="flex items-center gap-2 cursor-pointer p-1" role="button" aria-label="Open user menu">
                                <Avatar
                                    name={getUserDisplayName()[0].toUpperCase()}
                                    size="sm"
                                    className="bg-blue-500 text-white"
                                />
                                <div className="hidden sm:flex flex-col items-start">
                                    <span className="text-sm font-medium truncate max-w-[120px]">{getUserDisplayName()}</span>
                                    <Chip
                                        size="sm"
                                        color={getRoleColor(user?.role || "")}
                                        variant="flat"
                                        className="text-xs"
                                    >
                                        {user?.role === "admin" ? "Admin" : "Store"}
                                    </Chip>
                                </div>
                            </div>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="User menu">
                            <DropdownItem key="profile" className="h-14 gap-2">
                                <div className="flex flex-col">
                                    <p className="font-semibold">{getUserDisplayName()}</p>
                                    <p className="text-small text-gray-500 truncate">{user?.email}</p>
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
