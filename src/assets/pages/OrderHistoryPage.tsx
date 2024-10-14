import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/react";
import {useEffect, useState} from "react";
import OrderManagement, {getWeekNumber, Orders} from "../ts/Orders.ts";

export default function OrderHistoryPage()
{
    const [orders, setOrders] = useState<Orders[]>([]);
    useEffect(() =>
    {
        OrderManagement.getOrders().then((orders) => setOrders(orders));
    }, []);

    return (
        <div>
            <h1>Order History</h1>
            <p>Here you can view your order history.</p>
            <Table>
                <TableHeader>
                    <TableColumn>Week</TableColumn>
                    <TableColumn>Week Starting</TableColumn>
                    <TableColumn>Order#</TableColumn>
                    <TableColumn>Store</TableColumn>
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