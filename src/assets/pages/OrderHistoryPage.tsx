import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/react";
import {useEffect, useState} from "react";
import OrderManagement, {getWeekNumber, Orders, OrderStatus} from "../ts/Orders.ts";
import StoreFilterDropdown from "../components/OrderHistory/StoreFilterDropdown.tsx";
import OrderStatusFilterDropdown from "../components/OrderHistory/OrderStatusFilterDropdown.tsx";
import WeekFilterDropdown from "../components/OrderHistory/WeekFilterDropdown.tsx";

export default function OrderHistoryPage()
{
    const [orders, setOrders] = useState<Orders[]>([]);
    const [filterByStores, setFilterByStores] = useState<string[] | "all">("all");
    const [filterByStatus, setFilterByStatus] = useState<OrderStatus[] | "all">("all");
    // const [filterByWeek, setFilterByWeek] = useState<number | "all">("all");


    useEffect(() =>
    {
        OrderManagement.getOrders().then((orders) => setOrders(orders));
    }, []);

    return (
        <div className={"flex flex-col mx-10 mt-4"}>
            <h1 className={"text-4xl font-bold"}>Order History</h1>
            <p className={"italic mb-4"}>Here you can view your order history.</p>
            <Table removeWrapper aria-label="Order history table">
                <TableHeader>
                    <TableColumn allowsSorting key={"week"}>Week</TableColumn>
                    <TableColumn allowsSorting key={"week-start"}>Week Starting <WeekFilterDropdown/></TableColumn>
                    <TableColumn allowsSorting key={"order-number"}>Order#</TableColumn>
                    <TableColumn allowsSorting key={"store"}>Store <StoreFilterDropdown value={filterByStores} onValueChange={setFilterByStores}/></TableColumn>
                    <TableColumn allowsSorting key={"status"}>Status <OrderStatusFilterDropdown value={filterByStatus} onValueChange={setFilterByStatus}/></TableColumn>
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

