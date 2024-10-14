import {ReactNode, useEffect, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";
import SquareBackdrop from "../images/SquareBackdrop.svg.tsx";
import $ from "jquery";
import {cn} from "@nextui-org/react";

interface NavigationDropdownProps
{
    trigger: string | ReactNode;
    title?: string | ReactNode;
    subtitle?: string | ReactNode;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    children: ReactNode[] & { type: typeof NavigationDropdownItem }[] | ReactNode & { type: typeof NavigationDropdownItem };
}

export default function NavigationDropdown(props: NavigationDropdownProps)
{
    useEffect(() =>
    {
        if (props.onOpenChange)
        {
            props.onOpenChange(props.isOpen);
        }
    }, [props.isOpen]);
    return (
        <div className={"h-full"}>
            <div className={"flex flex-row uppercase font-bold cursor-pointer hover:bg-black/10 transition-colors h-full items-center px-4"} onClick={() => props.onOpenChange(!props.isOpen)}>
                <span className={"mr-8"}>{props.trigger}</span>
                <FontAwesomeIcon icon={faChevronDown} width={14} data-open={props.isOpen} className={"data-[open=true]:rotate-180 transition-all"}/>
            </div>
            <div className={"w-screen max-h-[370px] h-[370px] bg-white border-b-primary border-b-2 shadow-lg fixed left-0 right-0 flex flex-row data-[open=false]:max-h-0 transition-all overflow-hidden"} data-open={props.isOpen}>
                <div className={"min-w-[480px] w-[480px] bg-primary relative flex flex-col items-center justify-center"}>
                    <div className={"z-10 flex flex-col gap-4"}>
                        {props.title}
                        {props.subtitle}
                    </div>
                    <div className={"absolute left-0 right-0 top-0 bottom-0"}><SquareBackdrop/></div>
                </div>
                <div className={"flex flex-col flex-wrap justify-start items-start gap-3 text-black overflow-x-auto w-full"}>
                    {props.children}
                </div>
            </div>

        </div>
    );
}

export function NavigationDropdownItem(props: { children: ReactNode, icon?: ReactNode })
{
    const [hovering, setHovering] = useState(false);
    const id = Math.random().toString(36).substring(7);
    const key = `navigation-dropdown-item-${id}`;
    useEffect(() =>
    {
        $(`#${key}`)
            .on("mouseenter", () => setHovering(true))
            .on("mouseleave", () => setHovering(false));
    }, []);
    return (
        <div
            key={key}
            id={key}
            className={
                cn(
                    "flex flex-col gap-4 items-center justify-center w-[150px] h-[160px]",
                    "bg-white p-4 cursor-pointer uppercase font-bold text-[#221E20]",
                    "data-[hovering=true]:outline-primary outline-2 outline outline-transparent data-[hovering=true]:bg-primary/10"
                )
            }
            data-hovering={hovering}>
            {props.icon && (
                <div key={`icon-${id}`} className={"data-[hovering=true]:animate-[wiggle_1s_ease-in-out_infinite] data-[hovering=true]:scale-75 transform-none transition-all"} data-hovering={hovering}>
                    {props.icon}
                </div>

            )}
            {props.children}
        </div>
    );
}