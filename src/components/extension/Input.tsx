import {forwardRef} from "react";
import {cn, Input as OGInput, InputProps} from "@heroui/react";

export const Input = forwardRef<HTMLInputElement, InputProps>((props, element) =>
{
    return (
        <OGInput
            ref={element}
            classNames={{
                input: cn("!outline-none", props.classNames?.input)
            }}
            {...props}
        />
    );
});