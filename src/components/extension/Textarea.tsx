import {forwardRef} from "react";
import {cn, Textarea as Component, TextAreaProps} from "@heroui/react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextAreaProps>((props, element) =>
{
    return (
        <Component
            ref={element}
            {...props}
            classNames={{
                input: cn("!outline-none", props.classNames?.input)
            }}
        />
    );
});