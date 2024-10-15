import {useEffect, useState} from "react";
import {Button, Checkbox, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger, Tooltip} from "@nextui-org/react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckDouble, faFilter} from "@fortawesome/free-solid-svg-icons";
import {OrderStatus} from "../../ts/Orders.ts";
import {faSquare} from "@fortawesome/free-regular-svg-icons";

interface OrderStatusFilterDropdownProps
{
    value: OrderStatus[] | "all";
    onValueChange: (status: OrderStatus[] | "all") => void;
}


export default function OrderStatusFilterDropdown(props: OrderStatusFilterDropdownProps)
{
    const [selected, setSelected] = useState<OrderStatus[] | "all">(props.value);
    const orderStatuses: OrderStatus[] = Object.values(OrderStatus);

    useEffect(() =>
    {
        props.onValueChange(selected);
    }, [selected]);

    return (
        <Dropdown>
            <DropdownTrigger>
                <div className={"inline-block"}>
                    <Tooltip content={"Filter by Order Status"} classNames={{base: "pointer-events-none"}}>
                        <Button
                            size={"sm"}
                            className={"min-w-0 w-8 h-8"}
                            variant={"light"}
                            onPressStart={e => e.continuePropagation()}
                            aria-label={"Filter by order status"}
                            aria-labelledby={"Filter by order status"}
                        >
                            <FontAwesomeIcon icon={faFilter}/>
                        </Button>
                    </Tooltip>
                </div>
            </DropdownTrigger>
            <DropdownMenu>
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
                                variant={Array.isArray(selected) && selected.length === 0 ? "solid" : "light"}
                                color={Array.isArray(selected) && selected.length === 0 ? "primary" : "default"}
                                onClick={() => setSelected([])}
                            >
                                <FontAwesomeIcon icon={faSquare}/>
                            </Button>
                        </Tooltip>
                    </div>
                </DropdownItem>
                <DropdownSection title={"Order Status"}>
                    {
                        orderStatuses.map((status) => (
                            <DropdownItem key={status} textValue={status} closeOnSelect={false}>
                                <Checkbox
                                    value={status}
                                    isSelected={selected === "all" || (Array.isArray(selected) && selected.includes(status))}
                                    onValueChange={
                                        checked =>
                                        {
                                            let items: OrderStatus[] | "all";
                                            if (checked)
                                            {
                                                if (Array.isArray(selected))
                                                {
                                                    items = [...selected, status];
                                                    if (items.length === orderStatuses.length)
                                                    {
                                                        items = "all";
                                                    }
                                                } else
                                                {
                                                    items = orderStatuses.length === 1 ? "all" : [status];
                                                }
                                            } else
                                            {
                                                if (selected === "all")
                                                {
                                                    items = orderStatuses.filter(name => name !== status);
                                                } else
                                                {
                                                    items = (selected as OrderStatus[]).filter(name => name !== status);
                                                }
                                            }

                                            setSelected(items);
                                        }
                                    }
                                    className={"w-full max-w-[unset]"}
                                >
                                    <span className={"capitalize"}>{status}</span>
                                </Checkbox>
                            </DropdownItem>
                        ))
                    }
                </DropdownSection>
            </DropdownMenu>
        </Dropdown>
    );
}