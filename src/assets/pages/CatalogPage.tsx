import {setTitle} from "../../main.tsx";
import {Checkbox, CheckboxGroup, Input, ScrollShadow, Slider, Tab, Tabs} from "@nextui-org/react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDollarSign, faMagnifyingGlass} from "@fortawesome/free-solid-svg-icons";
import ListIcon from "../images/ListIcon.svg.tsx";
import GridIcon from "../images/GridIcon.svg.tsx";
import {useState} from "react";
import CatalogItem from "../components/Catalog/CatalogItem.tsx";
import {ProductCategory} from "../ts/Products.ts";
import ExtendedSwitch from "../components/Extends/ExtendedSwitch.tsx";

export enum View
{
    LIST = "list",
    GRID = "grid"
}

export default function CatalogPage()
{
    const [view, setView] = useState<View>(View.GRID);
    const [search, setSearch] = useState<string>("");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    setTitle("Catalog");
    return (
        <div className={"flex flex-row mt-8 mx-8"}>
            <div className={"flex flex-col gap-8 min-w-[400px] w-[25%] max-w-[600px] bg-default-100 rounded-2xl p-4"}>
                <div className={"flex flex-col w-4/5"}>
                    <h1 className={"text-4xl font-bold"}>Catalog</h1>
                    <p className={"italic mb-4"}>Here you can view the catalog of items available to send to your store.</p>
                </div>
                <div className={"flex flex-row"}>
                    <Input
                        label={"Search"}
                        placeholder={"Search for items"}
                        description={"Search for items in the catalog"}
                        startContent={<FontAwesomeIcon icon={faMagnifyingGlass}/>}
                        value={search}
                        onValueChange={setSearch}
                        classNames={{
                            inputWrapper: "bg-default-200 data-[hover=true]:bg-default-300 data-[focus=true]:!bg-default-300"
                        }}
                    />
                    <Tabs
                        size={"lg"}
                        classNames={{
                            tabList: "bg-background-L200 data-[selected=true]:text-primary",
                            tab: "aspect-square w-[38px] h-[38px]",
                            cursor: "dark:!bg-primary-L000/20 !bg-primary-L000 dark:outline outline-2 outline-primary"
                        }}
                        selectedKey={view}
                        defaultSelectedKey={view}
                        onSelectionChange={(index) =>
                        {
                            const view = index === "list" ? View.LIST : View.GRID;
                            setView(view);
                        }}
                    >
                        <Tab key={"list"} title={<ListIcon size={18}/>}/>
                        <Tab key={"grid"} title={<GridIcon size={18}/>}/>
                    </Tabs>
                </div>
                <Slider
                    maxValue={1000}
                    minValue={0}
                    value={priceRange}
                    getValue={(value) => `$${value}`}
                    onChange={value => setPriceRange(value as [number, number])}
                    showTooltip
                    aria-label={"price range"}
                    label={"Price Range"}
                    size={"lg"}

                    renderValue={() =>
                    {
                        return (
                            <div className={"flex flex-row gap-2"}>
                                <Input
                                    startContent={<FontAwesomeIcon icon={faDollarSign}/>}
                                    classNames={{inputWrapper: "bg-default-200"}}
                                    className={"min-w-24 w-24"}
                                    label={"Min"}
                                    aria-label={"minimum price range"}
                                    value={priceRange[0].toString()}
                                    onValueChange={value => setPriceRange([parseFloat(value.replace(/[^0-9.]/g, "")), priceRange[1]])}
                                />
                                <Input
                                    startContent={<FontAwesomeIcon icon={faDollarSign}/>}
                                    classNames={{inputWrapper: "bg-default-200"}}
                                    className={"min-w-24 w-24"}
                                    label={"Max"}
                                    aria-label={"maximum price range"}
                                    value={priceRange[1].toString()}
                                    onValueChange={value => setPriceRange([priceRange[0], parseFloat(value.replace(/[^0-9.]/g, ""))])}
                                />
                            </div>
                        );
                    }}
                />

                <CheckboxGroup label={"Category"}>
                    {Object.values(ProductCategory).map(category => (
                        <Checkbox key={category} value={category as string}>{category}</Checkbox>
                    ))}
                </CheckboxGroup>
                <ExtendedSwitch
                    label={"Show Seasonal Only"}
                    description={"Only show seasonal items"}
                />

            </div>


            <ScrollShadow className={"max-h-[85dvh] min-w-[300px]"}>
                {view === View.LIST ? (
                    <div className={"flex flex-col"}>
                        {Array.from({length: 13}).map(() => (
                            <CatalogItem view={view} name={"Blue Diamond Smokehouse Almonds"} price={49.99} image={"https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRSTbkqwdWqSqAABwUNdSEcdH0EaVTQEWkUeh7j1pUjPPtvvtdins3eDpcsxA15Klvuvw17sJIO2ObvHg1UgKskCcDzed7eUcPLZfPHBP9j7AXCr_iOdQy7KQ"}/>
                        ))}
                    </div>
                ) : (
                    <div className={"flex flex-row flex-wrap"}>
                        {Array.from({length: 13}).map(() => (
                            <CatalogItem view={view} name={"Blue Diamond Smokehouse Almonds"} price={49.99} image={"https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRSTbkqwdWqSqAABwUNdSEcdH0EaVTQEWkUeh7j1pUjPPtvvtdins3eDpcsxA15Klvuvw17sJIO2ObvHg1UgKskCcDzed7eUcPLZfPHBP9j7AXCr_iOdQy7KQ"}/>
                        ))}
                    </div>
                )}
            </ScrollShadow>

        </div>
    );
}