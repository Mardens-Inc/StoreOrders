import {Button, ButtonGroup, Calendar, DateValue, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Tooltip} from "@nextui-org/react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFilter} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useState} from "react";
import {getLocalTimeZone, startOfWeek, today} from "@internationalized/date";

interface WeekFilterDropdownProps
{
    value: DateValue | null;
    onValueChange: (status: DateValue | null) => void;
}


export default function WeekFilterDropdown(props: WeekFilterDropdownProps)
{
    const [selected, setSelected] = useState<DateValue | null>(props.value);

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
            <DropdownMenu>
                <DropdownItem key={"calendar"} closeOnSelect={false} className={"data-[hover]:bg-transparent p-0"} textValue={selected?.toString()}>
                    <Calendar
                        defaultValue={selected}
                        value={selected}
                        showMonthAndYearPickers
                        className={"shadow-none"}
                        onChange={date =>
                        {
                            console.log(date);
                            setSelected(date);
                        }}
                        topContent={
                            <ButtonGroup className={"w-full"}>
                                <Button
                                    size={"sm"}
                                    variant={"bordered"}
                                    radius={"full"}
                                    onClick={() => setSelected(null)}
                                >
                                    Clear
                                </Button>
                                <Button
                                    size={"sm"}
                                    variant={"bordered"}
                                    radius={"full"}
                                    onClick={() => setSelected(today(getLocalTimeZone()))}
                                >
                                    This Week
                                </Button>
                                <Button
                                    size={"sm"}
                                    variant={"bordered"}
                                    radius={"full"}
                                    onClick={() => setSelected(startOfWeek(today(getLocalTimeZone()).add({weeks: 1}), "en-US"))}
                                >
                                    Next Week
                                </Button>
                            </ButtonGroup>
                        }
                    />
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
}