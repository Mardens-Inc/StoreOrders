import {Navbar, NavbarBrand, NavbarContent, NavbarItem} from "@nextui-org/navbar";
import {Avatar, Badge, Button, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger, Image, Input, Link, Select, SelectItem, Tooltip} from "@nextui-org/react";
import logo from "../images/mardens-logo.svg";
import {faCalendarDays, faChevronDown, faEdit, faHistory, faPlus, faShoppingCart, faSignOut, faTrash} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import NavigationDropdown, {NavigationDropdownItem} from "./NavigationDropdown.tsx";
import Pants from "../images/Pants.svg.tsx";
import {useEffect, useState} from "react";
import {useAuthProvider} from "../providers/AuthProviderProvider.tsx";
import LoginForm from "./LoginForm.tsx";
import {Theme} from "../ts/Theme.ts";
import {useTheme} from "../providers/ThemeProvider.tsx";
import {useCart} from "../providers/CartProvider.tsx";

export default function Navigation()
{
    const {auth, isLoggedIn, logout} = useAuthProvider();
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [username, setUsername] = useState<string>(isLoggedIn ? auth.getUserProfile().username : "Guest");
    const {theme, setTheme} = useTheme();
    const {cart, removeProduct} = useCart();

    useEffect(() =>
    {
        setUsername(isLoggedIn ? auth.getUserProfile().username : "Guest");
    }, [isLoggedIn]);


    return (
        <Navbar maxWidth={"full"} className={"bg-primary text-white"}>
            <NavbarContent justify={"start"} key={"navbar-start-content"}>
                <NavbarBrand className={"max-w-[200px] mr-4"} key={"navbar-brand"} as={Link} href={"/"}>
                    <Image src={logo} radius={"none"} width={200} key={"navbar-logo"}/>
                </NavbarBrand>
                <NavbarItem key={"category-dropdown"} className={"h-full"}>
                    <NavigationDropdown
                        key={"category-dropdown-item"}
                        isOpen={openDropdown === 0}
                        onOpenChange={(isOpen) => setOpenDropdown(isOpen ? 0 : null)}
                        trigger={"categories"}
                        title={
                            <div className={"flex flex-col items-center justify-center text-center text-4xl uppercase"}>
                                <p className={"font-thin text-[29.06px]"} key={"select-a"}>select a</p>
                                <p className={"font-black text-[47px]"} key={"category"}>category</p>
                            </div>
                        }
                        subtitle={<p className={"text-center"} key={"category-subtitle"}>To find your item by category,<br/>select a category here</p>}
                    >
                        <NavigationDropdownItem key={"pants-category"} icon={<Pants/>}>Clothing</NavigationDropdownItem>
                    </NavigationDropdown>
                </NavbarItem>
            </NavbarContent>

            <NavbarContent justify="end" key={"navbar-end-content"}>
                <NavbarItem key={"cart-dropdown"} className={"h-full flex items-center"}>
                    <Dropdown classNames={{content: "w-full min-w-[300px] bg-default-100/75 backdrop-blur-md"}} key={"user-dropdown-content"}>
                        <DropdownTrigger key={"user-dropdown-trigger"}>
                            <div>
                                <Badge content={cart.length}>
                                    <Button radius={"full"} className={"min-w-0 w-10 h-10 bg-white"} onPressStart={e => e.continuePropagation()}>
                                        <FontAwesomeIcon icon={faShoppingCart} color={"black"}/>
                                    </Button>
                                </Badge>
                            </div>
                        </DropdownTrigger>
                        <DropdownMenu classNames={{list: "bg-transparent max-h-[400px] overflow-y-auto"}} key={"user-dropdown-menu"}>
                            {(() =>
                            {
                                return cart.map(item => (
                                    <DropdownItem key={item.id} closeOnSelect={false}>
                                        <div id={item.id} className={"gap-4 flex flex-row items-center justify-center rounded-2xl"}>
                                            <div className={"bg-white w-[64] h-[64] rounded-lg overflow-hidden"}>
                                                <Image src={item.image} width={64} height={64} className={"object-center object-contain data-[hover=true]:scale-110"}/>
                                            </div>
                                            <div className={"flex flex-row gap-2 w-full py-2 items-center"}>
                                                {item.name.length >= 20 ? (
                                                    <Tooltip content={item.name} closeDelay={0} classNames={{base: "pointer-events-none"}}>
                                                        <p className={"font-bold text-lg mr-auto max-w-[200px] truncate"}>{item.name}</p>
                                                    </Tooltip>
                                                ) : (
                                                    <p className={"font-bold text-lg mr-auto max-w-[200px] truncate"}>{item.name}</p>
                                                )}
                                                <p className={"text-sm font-bold opacity-50"}>${item.price.toFixed(2)}</p>
                                                <Input
                                                    value={item.quantity.toFixed(0)}
                                                    label={"Quantity"}
                                                    type={"number"}
                                                    min={1}
                                                    className={"w-20"}
                                                    classNames={{inputWrapper: "!bg-default-200"}}
                                                />
                                            </div>
                                            <Button color={"primary"} className={"font-medium min-w-0 grow shrink"} onClick={() => removeProduct(item)}><FontAwesomeIcon icon={faTrash}/></Button>
                                        </div>
                                    </DropdownItem>
                                ));
                            })()}
                        </DropdownMenu>
                    </Dropdown>
                </NavbarItem>
                <NavbarItem key={"user-dropdown"} className={"h-full"}>
                    <Dropdown classNames={{content: "w-full min-w-[300px] bg-default-100/75  backdrop-blur-md"}} key={"user-dropdown-content"}>
                        <DropdownTrigger key={"user-dropdown-trigger"}>
                            <div className={"flex flex-row uppercase font-bold cursor-pointer hover:bg-black/10 transition-colors h-full items-center px-4"}>
                                <span className={"mr-8 inline-flex items-center justify-center gap-2"}><Avatar/> {username}</span>
                                <FontAwesomeIcon icon={faChevronDown} width={14}/>
                            </div>
                        </DropdownTrigger>
                        <DropdownMenu key={"user-dropdown-menu"} classNames={{list: "bg-transparent"}}>
                            {isLoggedIn ? (
                                <>
                                    <DropdownSection title={"Admin Actions"} showDivider>
                                        <DropdownItem
                                            key={"edit-catalog"}
                                            description={"Manage the catalog of items"}
                                            endContent={<FontAwesomeIcon icon={faEdit}/>}
                                            href={"/catalog/edit"}
                                        >
                                            Manage Catalog
                                        </DropdownItem>
                                    </DropdownSection>
                                    <DropdownSection title={"Actions"} showDivider>
                                        <DropdownItem
                                            key={"new-order"}
                                            description={"View the catalog to start a new order"}
                                            endContent={<FontAwesomeIcon icon={faPlus}/>}
                                            href={"/catalog"}
                                        >
                                            New Order
                                        </DropdownItem>
                                        <DropdownItem
                                            key={"seasonal-orders"}
                                            description={"Manage the list of seasonal items"}
                                            endContent={<FontAwesomeIcon icon={faCalendarDays}/>}
                                            href={"/seasonal"}
                                        >
                                            Manage Seasonal Orders
                                        </DropdownItem>
                                        <DropdownItem
                                            key={"order-history"}
                                            description={"View your order history"}
                                            endContent={<FontAwesomeIcon icon={faHistory}/>}
                                            href={"/"}
                                        >
                                            Order History
                                        </DropdownItem>

                                    </DropdownSection>
                                    <DropdownSection>
                                        <DropdownItem key={"theme-selector"} closeOnSelect={false} className={"data-[hover]:bg-transparent"} textValue={theme}>
                                            <Select
                                                label={"Theme"}
                                                description={"Select a theme for this site"}
                                                defaultSelectedKeys={[theme]}
                                                onSelectionChange={key => setTheme(([...key][0] as any) as Theme)}
                                                classNames={{
                                                    value: "capitalize"
                                                }}
                                            >
                                                <SelectItem key={Theme.light} textValue={Theme.light} value={Theme.light}>Light</SelectItem>
                                                <SelectItem key={Theme.dark} textValue={Theme.dark} value={Theme.dark}>Dark</SelectItem>
                                            </Select>
                                        </DropdownItem>
                                        <DropdownItem
                                            key={"logout"}
                                            endContent={<FontAwesomeIcon icon={faSignOut}/>}
                                            onClick={logout}
                                            closeOnSelect={false}
                                            description={"Logout from your account"}
                                        >
                                            Logout
                                        </DropdownItem>
                                    </DropdownSection>
                                </>
                            ) : (
                                <>
                                    <DropdownItem key={"login-form"} className={"data-[hover]:bg-transparent cursor-default"} closeOnSelect={false}>
                                        <LoginForm/>
                                    </DropdownItem>
                                </>
                            )}
                        </DropdownMenu>
                    </Dropdown>
                </NavbarItem>
            </NavbarContent>
        </Navbar>);
}