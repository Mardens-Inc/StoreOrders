import {useEffect, useState} from "react";
import StoreManagement, {Store} from "../../ts/Stores.ts";
import {Button, Checkbox, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger, Tooltip} from "@nextui-org/react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckDouble, faFilter} from "@fortawesome/free-solid-svg-icons";
import {faSquare} from "@fortawesome/free-regular-svg-icons";

interface StoreFilterDropdownProps
{
    value: string[] | "all";
    onValueChange: (stores: string[] | "all") => void;
}

export default function StoreFilterDropdown(props: StoreFilterDropdownProps)
{
    const [selected, setSelected] = useState<string[] | "all">(props.value);
    const [stores, setStores] = useState<Store[]>([]);

    useEffect(() =>
    {
        StoreManagement.getStores().then((stores) => setStores(stores));
    }, []);

    useEffect(() =>
    {
        props.onValueChange(selected);
    }, [selected]);
    return (
        <Dropdown>
            <DropdownTrigger>
                <div className={"inline-block"}>
                    <Tooltip content={"Filter by Stores"} classNames={{base: "pointer-events-none"}}>
                        <Button
                            size={"sm"}
                            className={"min-w-0 w-8 h-8"}
                            variant={"light"}
                            onPressStart={e => e.continuePropagation()}
                            aria-label={"Filter by store"}
                            aria-labelledby={"Filter by store"}
                        >
                            <FontAwesomeIcon icon={faFilter}/>
                        </Button>
                    </Tooltip>
                </div>
            </DropdownTrigger>
            <DropdownMenu >
                <DropdownItem key={"all"} textValue={"all"} closeOnSelect={false} className={"data-[hover]:bg-transparent"}>
                    <div className={"inline-flex flex-row gap-1"}>
                        <Tooltip content={"Select All"}>
                            <Button
                                className={"min-w-0 w-10"}
                                variant={selected === "all" ? "solid" : "light"}
                                color={selected === "all" ? "primary" : "default"}
                                onClick={() => setSelected("all")}
                            >
                                <FontAwesomeIcon icon={faCheckDouble}/>
                            </Button>
                        </Tooltip>
                        <Tooltip content={"Select None"}>
                            <Button
                                className={"min-w-0 w-10"}
                                variant={selected.length === 0 ? "solid" : "light"}
                                color={selected.length === 0 ? "primary" : "default"}
                                onClick={() => setSelected([])}
                            >
                                <FontAwesomeIcon icon={faSquare}/>
                            </Button>
                        </Tooltip>
                    </div>
                </DropdownItem>
                <DropdownSection title={"Stores"} className={"max-h-[200px] overflow-y-auto"}>
                    {
                        stores.map((store) => (
                            <DropdownItem key={store.id} textValue={store.name} closeOnSelect={false}>
                                <Checkbox
                                    value={store.name}
                                    isSelected={selected === "all" || selected.includes(store.name)}
                                    onValueChange={
                                        checked =>
                                        {
                                            let items: string[] | "all";
                                            if (checked)
                                            {
                                                if (Array.isArray(selected))
                                                {
                                                    items = [...selected, store.name];
                                                    if (items.length === stores.length)
                                                    {
                                                        items = "all";
                                                    }
                                                } else
                                                {
                                                    items = stores.length === 1 ? "all" : [store.name];
                                                }
                                            } else
                                            {
                                                if (selected === "all")
                                                {
                                                    items = stores.map(s => s.name).filter(name => name !== store.name);
                                                } else
                                                {
                                                    items = (selected as string[]).filter(name => name !== store.name);
                                                }
                                            }

                                            setSelected(items);
                                        }
                                    }
                                    className={"w-full max-w-[unset]"}
                                >
                                    {store.name}
                                </Checkbox>
                            </DropdownItem>
                        ))
                    }
                </DropdownSection>
            </DropdownMenu>
        </Dropdown>
    );
}