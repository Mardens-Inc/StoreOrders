import {Button, Chip, DateValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/react";
import {useEffect, useState} from "react";
import OrderManagement, {getWeekNumber, Orders, OrderStatus} from "../ts/Orders.ts";
import StoreFilterDropdown from "../components/OrderHistory/StoreFilterDropdown.tsx";
import OrderStatusFilterDropdown from "../components/OrderHistory/OrderStatusFilterDropdown.tsx";
import WeekFilterDropdown from "../components/OrderHistory/WeekFilterDropdown.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEye, faPrint} from "@fortawesome/free-solid-svg-icons";
import {setTitle} from "../../main.tsx";

export default function OrderHistoryPage()
{
    setTitle("Order History");
    const [orders, setOrders] = useState<Orders[]>([]);
    const [filterByStores, setFilterByStores] = useState<string[] | "all">("all");
    const [filterByStatus, setFilterByStatus] = useState<OrderStatus[] | "all">("all");
    const [filterByWeek, setFilterByWeek] = useState<DateValue | null>(null);


    useEffect(() =>
    {
        OrderManagement.getOrders().then((orders) => setOrders(orders));
    }, []);

    return (
        <div className={"flex flex-col mx-10 mt-4"}>
            <h1 className={"text-4xl font-bold"}>Order History</h1>
            <p className={"italic mb-4"}>Here you can view your order history.</p>
            <Table removeWrapper aria-label="Order history table" selectionMode={"single"}>
                <TableHeader>
                    <TableColumn allowsSorting key={"order-number"}>Order#</TableColumn>
                    <TableColumn allowsSorting key={"week"}>Week</TableColumn>
                    <TableColumn allowsSorting key={"week-start"}>Week Starting <WeekFilterDropdown value={filterByWeek} onValueChange={setFilterByWeek}/></TableColumn>
                    <TableColumn allowsSorting key={"store"}>Store <StoreFilterDropdown value={filterByStores} onValueChange={setFilterByStores}/></TableColumn>
                    <TableColumn allowsSorting key={"status"}>Status <OrderStatusFilterDropdown value={filterByStatus} onValueChange={setFilterByStatus}/></TableColumn>
                    <TableColumn key={"actions"} className={"w-0"}>Actions</TableColumn>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell>{order.id}</TableCell>
                            <TableCell>{getWeekNumber(order.week)}</TableCell>
                            <TableCell>{order.week.toDateString()}</TableCell>
                            <TableCell>{order.store.name}</TableCell>
                            <TableCell className={"capitalize"}>
                                {(() =>
                                    {
                                        switch (order.status)
                                        {
                                            case OrderStatus.CURRENT:
                                                return <Chip color={"primary"} variant={"shadow"} className={"max-w-[unset] min-w-24"}>Current</Chip>;
                                            case OrderStatus.COMPLETED:
                                                return <Chip color={"success"} variant={"shadow"} className={"max-w-[unset] min-w-24"}>Completed</Chip>;
                                            case OrderStatus.PENDING:
                                                return <Chip color={"warning"} variant={"shadow"} className={"max-w-[unset] min-w-24"}>Pending</Chip>;
                                            case OrderStatus.CANCELLED:
                                                return <Chip color={"danger"} variant={"shadow"} className={"max-w-[unset] min-w-24"}>Cancelled</Chip>;
                                        }
                                    }
                                )()}
                            </TableCell>
                            <TableCell>
                                <div className={"flex flex-row gap-2"}>
                                    <Button variant={"light"} className={"min-w-0"}><FontAwesomeIcon icon={faEye}/></Button>
                                    <Button variant={"light"} className={"min-w-0"}><FontAwesomeIcon icon={faPrint}/></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

