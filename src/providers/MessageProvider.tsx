import {Context, createContext, JSX, ReactNode, useContext, useEffect, useState} from "react";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import {Icon} from "@iconify-icon/react";

/**
 * Represents the options for a message that can be displayed in the application.
 *
 * This type defines the structure of the data required to display messages,
 * including their content, appearance, and behavior.
 *
 * Properties:
 * - `title`: The title of the message to be displayed.
 * - `body`: The main content of the message. Can be a string or a ReactNode.
 * - `responseType`: The response type or category associated with the message.
 * - `severity`: Optional. Indicates the severity level of the message.
 *   Can be one of "info", "warning", "danger", or "success".
 * - `icon`: Optional. The icon associated with the message. Can be a string
 *   or a ReactNode.
 */
export type MessageOptions = {
    title: string;
    body: ReactNode | string;
    responseType: MessageResponseType;
    severity?: "info" | "warning" | "danger" | "success";
    icon?: ReactNode | string;
}

/**
 * Represents the properties required for a message component, combining specific behaviors and options.
 *
 * This type includes properties for controlling the visibility of the message, handling close interactions,
 * and any additional configurable options defined in `MessageOptions`.
 */
type MessageProperties = {
    isOpen: boolean;
    onClose: (response: boolean | null) => void;
} & MessageOptions;

/**
 * Enum representing types of message responses.
 *
 * This enumeration is used to define various types of message response options
 * that might be presented to a user in dialogs or message boxes.
 *
 * Members:
 * - YesNo: Represents a response type where the options are "Yes" and "No".
 * - OkayCancel: Represents a response type with "Okay" and "Cancel" options.
 * - Close: Represents a response type where the only option is to close the dialog.
 */
export enum MessageResponseType
{
    YesNo,
    OkayCancel,
    Close,
}


// Create separate option types for type safety
/**
 * Represents options for configuring a message that expects a Yes/No type of response.
 *
 * This type extends `MessageOptions` and includes additional configuration specific to Yes/No responses.
 */
type YesNoOptions = MessageOptions & { responseType: MessageResponseType.YesNo };
/**
 * Represents configuration options for a message that expects a response
 * of type `OkayCancel`. This type extends the base `MessageOptions` type
 * and adds a specific `responseType` property set to `MessageResponseType.OkayCancel`.
 *
 * Use this type when defining options for messages where the user is expected
 * to provide either an "Okay" or "Cancel" response.
 */
type OkayCancelOptions = MessageOptions & { responseType: MessageResponseType.OkayCancel };
/**
 * Represents the options used for closing a message with additional properties
 * extending from `MessageOptions` and requiring a specific response type.
 *
 * This type is used when specifying the parameters for a message closure
 * with a predefined response type indicating the action to close.
 *
 * It combines the base properties from `MessageOptions` and overrides
 * `responseType` to use the `MessageResponseType.Close` type.
 */
type CloseOptions = MessageOptions & { responseType: MessageResponseType.Close };

/**
 * Provides methods for displaying various types of message dialogs to users.
 * The MessageContextType interface defines a contract for handling user prompts
 * and dialogs with options and return values based on the type of dialog invoked.
 */
interface MessageContextType
{
    open(options: YesNoOptions): Promise<boolean>;

    open(options: OkayCancelOptions): Promise<boolean>;

    open(options: CloseOptions): Promise<void>;

    open(options: MessageOptions): Promise<boolean | null>;
}

/**
 * Represents the context for message-related state and actions in a React application.
 * This context is used to provide and consume message-related data and methods across the component tree.
 *
 * The initial value of the context is `undefined`. It should be wrapped with a corresponding provider
 * to supply the necessary state and functionality to components that consume this context.
 *
 * It is typically used in conjunction with a MessageContextProvider to deliver specific message
 * functionality, such as retrieving, sending, or updating message data.
 *
 * @type {React.Context<MessageContextType | undefined>}
 */
const MessageContext: Context<MessageContextType | undefined> = createContext<MessageContextType | undefined>(undefined);

/**
 * Provides a context for displaying messages using a modal dialog. Allows consumers to open a message dialog
 * with customizable options and await responses.
 *
 * @param {Object} props - The properties passed to the MessageProvider component.
 * @param {ReactNode} props.children - The child components to render inside the provider.
 * @return {JSX.Element} Returns a context provider that includes the message modal and the provided children.
 */
export function MessageProvider({children}: { children: ReactNode })
{
    const [messageOptions, setMessageOptions] = useState<MessageOptions | null>(null);
    const [resolvePromise, setResolvePromise] = useState<((value: boolean | null | void) => void) | null>(null);

    const open = (options: MessageOptions): Promise<boolean | null | void> =>
    {
        return new Promise((resolve) =>
        {
            setMessageOptions(options);
            setResolvePromise(() => resolve);
        });
    };

    const handleClose = (response: boolean | null) =>
    {
        setMessageOptions(null);
        if (resolvePromise)
        {
            if (messageOptions?.responseType === MessageResponseType.Close)
            {
                resolvePromise(undefined); // void for Close type
            } else
            {
                resolvePromise(response === null ? false : response); // guarantee boolean for YesNo/OkayCancel
            }
            setResolvePromise(null);
        }
    };

    return (
        <MessageContext.Provider value={{open: open as MessageContextType["open"]}}>
            <MessageModal
                isOpen={messageOptions != null}
                title={messageOptions?.title ?? ""}
                body={messageOptions?.body ?? ""}
                responseType={messageOptions?.responseType ?? MessageResponseType.Close}
                severity={messageOptions?.severity}
                onClose={handleClose}
            />
            {children}
        </MessageContext.Provider>
    );
}

/**
 * Custom hook to access the `MessageContext` and retrieve its value.
 * Ensures that the hook is used within a `MessageProvider`.
 *
 * @throws {Error} If the hook is used outside the `MessageProvider`.
 * @return {MessageContextType} The value of the `MessageContext`.
 */
export function useMessage(): MessageContextType
{
    const context = useContext(MessageContext);
    if (!context)
    {
        throw new Error("useMessage must be used within a MessageProvider");
    }
    return context;
}

/**
 * A functional component that renders a Message Modal with a customizable title, body, response type, icon, and severity level.
 * The modal provides keyboard accessibility, allowing users to trigger the primary action using the Enter or Space keys.
 *
 * @param {object} props - The properties to configure the Message Modal.
 * @param {string} props.title - The title displayed in the modal header.
 * @param {React.ReactNode} props.body - The content body displayed inside the modal.
 * @param {string} props.responseType - The type of response buttons displayed in the modal (e.g., Yes/No, Okay/Cancel, Close).
 * @param {React.ReactNode|string|null} props.icon - The icon displayed in the modal header. Can be a string (icon identifier), React node, or null.
 * @param {string} props.severity - The severity level of the modal (e.g., danger, warning, info, success).
 * @param {boolean} props.isOpen - Boolean flag indicating whether the modal is open or closed.
 * @param {function} props.onClose - Callback function triggered when the modal closes or a response is selected. Receives a response value.
 *
 * @return {JSX.Element} A modal component containing the specified properties and behavior.
 */
function MessageModal(props: MessageProperties)
{
    const {
        title,
        body,
        responseType,
        icon,
        severity,
        isOpen,
        onClose
    } = props;

    // Handle keyboard events for Enter and Space
    useEffect(() =>
    {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) =>
        {
            if (event.key === "Enter" || event.key === " ")
            {
                event.preventDefault();
                event.stopPropagation();
                // Trigger the primary action (Yes/Okay/Close)
                onClose(true);
            }
        };

        // Add event listener when modal is open
        document.addEventListener("keydown", handleKeyDown);

        // Cleanup event listener when modal closes or component unmounts
        return () =>
        {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => onClose(responseType === MessageResponseType.Close ? null : false)}
            scrollBehavior={"inside"}
            backdrop={"blur"}
            classNames={{
                backdrop: severity === "danger" ? "bg-danger/10" : ""
            }}
            data-severity={severity}
            isDismissable={false}
        >
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader className={"flex flex-row items-center gap-2 text-2xl"}>
                            <span className={"text-3xl h-[30px]"}>{typeof icon === "string" ? <Icon icon={icon}/> : icon == null ? <MessageIcon severity={severity}/> : icon}</span>
                            <span
                                className={"data-[severity=danger]:text-danger data-[severity=warning]:text-warning data-[severity=info]:text-blue-500 data-[severity=success]:text-success"}
                                data-severity={severity}
                            >
                                {title}
                            </span>
                        </ModalHeader>
                        <ModalBody>
                            {body}
                        </ModalBody>
                        <ModalFooter>
                            {({
                                [MessageResponseType.YesNo]: (
                                    <>
                                        <Button onPress={() => onClose(true)} color={severity === "danger" ? "danger" : "primary"} autoFocus>Yes</Button>
                                        <Button onPress={() => onClose(false)} variant={"light"}>No</Button>
                                    </>
                                ),
                                [MessageResponseType.OkayCancel]: (
                                    <>
                                        <Button radius={"none"} onPress={() => onClose(true)} color={severity === "danger" ? "danger" : "primary"} autoFocus>Okay</Button>
                                        <Button radius={"none"} onPress={() => onClose(false)} variant={"light"}>Cancel</Button>
                                    </>
                                ),
                                [MessageResponseType.Close]: (
                                    <Button radius={"none"} onPress={() => onClose(true)} autoFocus>Close</Button>
                                )
                            })[responseType]}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

/**
 * A React component that renders an icon based on the severity level provided.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {"info" | "warning" | "danger" | "success" | undefined} props.severity - Determines the type of icon to be rendered.
 *     - "info": Displays an informational icon styled with a blue color.
 *     - "warning": Displays a warning icon styled with a yellow color.
 *     - "danger": Displays a danger icon styled with a red color.
 *     - "success": Displays a success icon styled with a green color.
 *     - undefined: Renders no icon.
 *
 * @returns {JSX.Element | null} The appropriate icon JSX element or null if severity is undefined.
 */
const MessageIcon = ({severity}: { severity: "info" | "warning" | "danger" | "success" | undefined }): JSX.Element | null =>
{
    switch (severity)
    {
        case "info":
            return <Icon icon={"mdi:information-box"} className={"text-blue-500"}/>;
        case "warning":
            return <Icon icon={"ion:warning"} className={"text-warning"}/>;
        case "danger":
            return <Icon icon={"si:error-fill"} className={"text-danger"}/>;
        case "success":
            return <Icon icon={"ep:success-filled"} className={"text-success"}/>;
        default:
            return null;
    }
};