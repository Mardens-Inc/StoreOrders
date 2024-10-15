import {Button, Tooltip} from "@nextui-org/react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFilter} from "@fortawesome/free-solid-svg-icons";
import CalendarDropdown from "../Extends/CalendarDropdown.tsx";

// interface WeekFilterDropdownProps
// {
//     value: OrderStatus[] | "all";
//     onValueChange: (status: OrderStatus[] | "all") => void;
// }


export default function WeekFilterDropdown()
{
    // const [selected, setSelected] = useState<OrderStatus[] | "all">(props.value);
    // const orderStatuses: OrderStatus[] = Object.values(OrderStatus);

    // useEffect(() =>
    // {
    //     props.onValueChange(selected);
    // }, [selected]);

    return (
        <CalendarDropdown
            useButton={() =>
                <div className={"inline-block"}>
                    <Tooltip content={"Filter by Week"} classNames={{base: "pointer-events-none"}}>
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
            }
        />
    );
}