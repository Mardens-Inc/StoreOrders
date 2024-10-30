import {Button, Image, Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@nextui-org/react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass, faPencil, faPlus, faTrash} from "@fortawesome/free-solid-svg-icons";
import {useState} from "react";

export default function EditCatalogPage()
{
    const [search, setSearch] = useState<string>("");
    return (
        <div className={"flex flex-col w-4/5 mx-auto mt-10 gap-4"}>
            <h1 className={"text-4xl"}>Edit Catalog</h1>
            <div className={"flex flex-row gap-2"}>
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
                <Button className={"h-14"}><FontAwesomeIcon icon={faPlus}/></Button>
            </div>
            <Table
                removeWrapper
                isHeaderSticky
                classNames={{
                    base: "max-h-[calc(100dvh_-_256px)] min-h-[200px] overflow-scroll",
                    table: "min-h-[400px]"
                }}
            >
                <TableHeader>
                    <TableColumn hideHeader className={"min-w-0 w-0"}>Image</TableColumn>
                    <TableColumn>Name</TableColumn>
                    <TableColumn>Description</TableColumn>
                    <TableColumn>Retail Price</TableColumn>
                    <TableColumn>Mardens Price</TableColumn>
                    <TableColumn hideHeader className={"min-w-0 w-0"}>Actions</TableColumn>
                </TableHeader>
                <TableBody>
                    {Array.from({length: 10}).map(() =>
                        <TableRow>
                            <TableCell>
                                <Image src={"https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRSTbkqwdWqSqAABwUNdSEcdH0EaVTQEWkUeh7j1pUjPPtvvtdins3eDpcsxA15Klvuvw17sJIO2ObvHg1UgKskCcDzed7eUcPLZfPHBP9j7AXCr_iOdQy7KQ"} width={64} height={64} className={"min-w-16"}/>
                            </TableCell>
                            <TableCell>Blue Diamond Smokehouse Almonds</TableCell>
                            <TableCell>24 Oz Bag of Blue Diamond Smokehouse Almonds</TableCell>
                            <TableCell>$49.99</TableCell>
                            <TableCell>$49.99</TableCell>
                            <TableCell>
                                <div className={"flex flex-row items-center justify-end"}>
                                    <Button className={"min-w-0"} variant={"light"}><FontAwesomeIcon icon={faPencil}/></Button>
                                    <Button className={"min-w-0"} variant={"light"} color={"danger"}><FontAwesomeIcon icon={faTrash}/></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
