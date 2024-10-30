import {Button, Link} from "@nextui-org/react";

export default function PageNotFound()
{
    return (
        <div className={"w-[50vw] mx-auto mt-16 flex flex-col items-center justify-center gap-8"}>
            <h1 className={"text-7xl text-center"}>404 - Page Not Found</h1>
            <div className={"mx-auto gap-6 flex flex-row"}>
                <Button href={"/"} color={"primary"} size={"lg"} as={Link}>Go to Home</Button>
                <Button size={"lg"} onClick={()=>window.history.back()}>Back</Button>
            </div>
        </div>
    );
}