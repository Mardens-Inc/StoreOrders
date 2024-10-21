import {Button, ButtonGroup, Image, Tooltip} from "@nextui-org/react";
import {useEffect, useState} from "react";
import {useCart} from "../../providers/CartProvider.tsx";
import {View} from "../../pages/CatalogPage.tsx";
import $ from "jquery";
import {toast} from "sonner";

interface CatalogItemProps
{
    name: string;
    price: number;
    image: string;
    view: View;
}

export default function CatalogItem(props: CatalogItemProps)
{
    const id = `catalog-item-${Math.random().toString(36).substring(7)}`;
    const [hovering, setHovering] = useState<boolean>(false);
    const [quantity, setQuantity] = useState<number>(1);
    const {addProduct} = useCart();

    useEffect(() =>
    {
        $(`#${id}`)
            .on("mouseenter", () => setHovering(true))
            .on("mouseleave", () => setHovering(false));
    }, []);


    return (
        <div id={id} className={"flex flex-row flex-wrap"} data-hover={hovering}>
            <div className={"py-4 px-4 m-4 flex flex-col items-center justify-center bg-default-100 rounded-2xl w-[300px]"}>
                <div className={"bg-white w-[300] h-[200] rounded-lg overflow-hidden"}>
                    <Image src={props.image} width={300} height={200} className={"object-center object-contain data-[hover=true]:scale-110"} data-hover={hovering}/>
                </div>
                <div className={"flex flex-row gap-2 w-full py-2 items-center"}>
                    {props.name.length >= 20 ? (
                        <Tooltip content={props.name} closeDelay={0}>
                            <p className={"font-bold text-lg mr-auto max-w-[200px] truncate"}>{props.name}</p>
                        </Tooltip>
                    ) : (
                        <p className={"font-bold text-lg mr-auto max-w-[200px] truncate"}>{props.name}</p>
                    )}
                    <p className={"text-sm font-bold opacity-50"}>${props.price.toFixed(2)}</p>
                </div>
                <ButtonGroup className={"flex flex-row items-center w-full py-2"}>
                    <Button color={"primary"} className={"font-medium min-w-0 grow shrink"} onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>-</Button>
                    <Button color={"primary"} className={"font-medium min-w-[150px] grow shrink"} onClick={() =>
                    {
                        addProduct({id: id, image: props.image, name: props.name, price: props.price}, quantity);
                        setQuantity(1);
                        toast("Item added to cart", {description: `${quantity} ${props.name} added to cart`});
                    }}>Add <b>{quantity}</b> to Order</Button>
                    <Button color={"primary"} className={"font-medium min-w-0 grow shrink"} onClick={() => setQuantity(prev => prev + 1)}>+</Button>
                </ButtonGroup>
            </div>
        </div>
    );
}