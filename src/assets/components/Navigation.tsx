import {Navbar, NavbarBrand, NavbarContent, NavbarItem} from "@nextui-org/navbar";
import {Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Image, User} from "@nextui-org/react";
import logo from "../images/mardens-logo.svg";
import {faChevronDown, faShoppingCart} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import NavigationDropdown, {NavigationDropdownItem} from "./NavigationDropdown.tsx";
import Pants from "../images/Pants.svg.tsx";
import grid from "../images/grid.svg";
import {useState} from "react";

export default function Navigation()
{
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);

    return (
        <Navbar maxWidth={"full"} className={"bg-primary text-white"}>
            <NavbarContent justify={"start"} key={"navbar-start-content"}>
                <NavbarBrand className={"max-w-[200px] mr-4"} key={"navbar-brand"}>
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
                <NavbarItem key={"cart-dropdown"} className={"h-full"}>
                    <NavigationDropdown
                        key={"cart-dropdown-item"}
                        isOpen={openDropdown === 1}
                        onOpenChange={(isOpen) => setOpenDropdown(isOpen ? 1 : null)}
                        trigger={<><FontAwesomeIcon icon={faShoppingCart}/> cart</>}
                        title={
                            <div className={"flex flex-col items-center justify-center text-center text-4xl uppercase"}>
                                <p className={"font-thin text-[29.06px]"} key={"view-your"}>view your</p>
                                <p className={"font-black text-[47px]"} key={"cart"}>cart</p>
                            </div>
                        }
                        subtitle={<p className={"text-center"} key={"cart-subtitle"}>To find your item by category,<br/>select a category here</p>}
                    >
                        {Array.from({length: 11}, (_, i) => (
                            <NavigationDropdownItem key={i}>Item {i}</NavigationDropdownItem>
                        )).concat(
                            [
                                <NavigationDropdownItem icon={<Image src={grid} radius={"none"} width={64}/>} key={"checkout"}>Checkout</NavigationDropdownItem>
                            ]
                        )}
                    </NavigationDropdown>
                </NavbarItem>
                <NavbarItem key={"user-dropdown"}>
                    <Dropdown classNames={{content: "rounded-none w-full"}} key={"user-dropdown-content"}>
                        <DropdownTrigger key={"user-dropdown-trigger"}>
                            <div className={"flex flex-row cursor-pointer text-white items-center gap-8 hover:bg-black/10 p-3 transition-colors"}>
                                <User name={"Waterville Store"} className={"uppercase"} classNames={{name: "text-tiny font-bold"}} key={"user-waterville-store"}/>
                                <FontAwesomeIcon icon={faChevronDown} width={12} key={"user-chevron-down"}/>
                            </div>
                        </DropdownTrigger>
                        <DropdownMenu itemClasses={{base: "rounded-none"}} key={"user-dropdown-menu"}>
                            <DropdownItem key={"hi"}>hi</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </NavbarItem>
            </NavbarContent>
        </Navbar>);
}