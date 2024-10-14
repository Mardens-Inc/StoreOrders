import {Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip} from "@nextui-org/react";
import {useEffect, useState} from "react";
import OrderManagement, {getWeekNumber, Orders} from "../ts/Orders.ts";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFilter} from "@fortawesome/free-solid-svg-icons";

export default function OrderHistoryPage()
{
    const [orders, setOrders] = useState<Orders[]>([]);
    useEffect(() =>
    {
        OrderManagement.getOrders().then((orders) => setOrders(orders));
    }, []);

    return (
        <div className={"flex flex-col mx-10 mt-4"}>
            <h1 className={"text-4xl font-bold"}>Order History</h1>
            <p className={"italic mb-4"}>Here you can view your order history.</p>
            <Table
                removeWrapper
            >
                <TableHeader>
                    <TableColumn>Week</TableColumn>
                    <TableColumn>Week Starting</TableColumn>
                    <TableColumn>Order#</TableColumn>
                    <TableColumn>Store <StoreFilterDropdown/></TableColumn>
                    <TableColumn>Status</TableColumn>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell>{getWeekNumber(order.week)}</TableCell>
                            <TableCell>{order.week.toDateString()}</TableCell>
                            <TableCell>{order.id}</TableCell>
                            <TableCell>{order.store.name}</TableCell>
                            <TableCell className={"capitalize"}>{order.status}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function StoreFilterDropdown()
{
    return (
        <Dropdown>
            <DropdownTrigger>
                <span>
                    <Tooltip content={"Filter by Stores"} classNames={{base: "pointer-events-none"}}>
                        <Button
                            size={"sm"}
                            className={"min-w-0 w-8 h-8"}
                            variant={"light"}
                            onPressStart={e => e.continuePropagation()}
                        >
                            <FontAwesomeIcon icon={faFilter}/>
                        </Button>
                    </Tooltip>
                </span>
            </DropdownTrigger>
            <DropdownMenu>
                <DropdownItem>hello world</DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
}