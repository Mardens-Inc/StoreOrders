import {Button, ButtonGroup, Calendar, cn, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Switch, Textarea} from "@heroui/react";
import {useCallback, useRef, useState} from "react";
import {getLocalTimeZone, today} from "@internationalized/date";
import {motion} from "framer-motion";
import {DisableUserRequest, User} from "../../utils/types.ts";
import {authApi} from "../../utils/api.ts";
import {addToast} from "@heroui/toast";

type DisableUserModalProperties = {
    user: User,
    isOpen: boolean;
    onClose: () => void;
};

export default function DisableUserModalModal(props: DisableUserModalProperties)
{
    let now = today(getLocalTimeZone());
    const [hasExpirationDate, setHasExpirationDate] = useState(false);
    let [expirationDate, setExpirationDate] = useState(now);
    const [isLoading, setIsLoading] = useState(false);
    const reasonTextAreaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = useCallback(() =>
    {
        if (!props.user) return;
        setIsLoading(true);
        const reason = reasonTextAreaRef.current?.value || "";
        const data: DisableUserRequest = {user_id: props.user.id, reason, expiration: hasExpirationDate ? expirationDate.toDate(getLocalTimeZone()) : null};
        console.log("Form submitted", data);
        authApi.disableUser(data).then(() =>
        {
            addToast({
                title: "User Disabled!",
                description: `User ${props.user.email} has been disabled successfully`,
                color: "success"
            });
        }).catch(error =>
        {
            addToast({
                title: "Error",
                description: `Failed to disable user ${props.user.email}`,
                color: "danger"
            });
            console.error("Error disabling user", error);
        }).finally(handleReset);
    }, [expirationDate, reasonTextAreaRef, props.user]);

    const handleReset = useCallback(() =>
    {
        setIsLoading(false);
        setHasExpirationDate(false);
        if (reasonTextAreaRef.current) reasonTextAreaRef.current.value = "";
        setExpirationDate(today(getLocalTimeZone()));
        props.onClose();
    }, [reasonTextAreaRef, props.onClose]);

    if (!props.user) return;
    return (
        <Modal
            isOpen={props.isOpen}
            onClose={handleReset}
            scrollBehavior="inside"
            backdrop="blur"
        >
            <ModalContent>
                <ModalHeader>Disable {props.user.email}</ModalHeader>
                <ModalBody>
                    <Switch
                        isSelected={hasExpirationDate}
                        onValueChange={setHasExpirationDate}
                        classNames={{
                            base: cn(
                                "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center",
                                "justify-between cursor-pointer rounded-lg gap-2 px-1 py-2 border-2 border-transparent",
                                "data-[selected=true]:border-primary"
                            ),
                            wrapper: "p-0 h-4 overflow-visible",
                            thumb: cn(
                                "w-6 h-6 border-2 shadow-lg",
                                "group-data-[hover=true]:border-primary",
                                //selected
                                "group-data-[selected=true]:ms-6",
                                // pressed
                                "group-data-[pressed=true]:w-7",
                                "group-data-pressed:group-data-selected:ms-4"
                            )
                        }}
                    >
                        <p className="text-normal">Has Expiration Date</p>
                    </Switch>
                    <motion.div
                        className={"overflow-hidden p-px h-full shrink-0"}
                        initial={{opacity: 0, maxHeight: 0}}
                        animate={{opacity: hasExpirationDate ? 1 : 0, maxHeight: hasExpirationDate ? 360 : 0}}
                    >
                        <Calendar
                            aria-label={"Expiration date"}
                            calendarWidth={"100%"}
                            showMonthAndYearPickers
                            showHelper
                            value={expirationDate}
                            onChange={setExpirationDate}
                            onFocusChange={setExpirationDate}
                            focusedValue={expirationDate}
                            isDateUnavailable={date => date < now}
                            nextButtonProps={{
                                variant: "bordered"
                            }}
                            prevButtonProps={{
                                variant: "bordered"
                            }}
                            topContent={
                                <ButtonGroup fullWidth
                                             className="px-3 pb-2 pt-3 bg-content1 [&>button]:text-default-500 [&>button]:border-default-200/60"
                                             radius="full"
                                             size="sm"
                                             variant="bordered"
                                >
                                    <Button onPress={() => setExpirationDate(now)}>Now</Button>
                                    <Button onPress={() => setExpirationDate(now.add({weeks: 1}))}>Next week</Button>
                                    <Button onPress={() => setExpirationDate(now.add({months: 1}))}>Next Month</Button>
                                    <Button onPress={() => setExpirationDate(now.add({months: 6}))}>6 Months</Button>
                                    <Button onPress={() => setExpirationDate(now.add({years: 1}))}>1 Year</Button>
                                </ButtonGroup>
                            }
                        />
                    </motion.div>
                    <Textarea
                        ref={reasonTextAreaRef}
                        label={"Reason"}
                        placeholder={"Reason for disabling the user"}
                        description={"Enter the reason for disabling the user, this will appear to the user to explain why they are being disabled."}
                        isClearable
                        classNames={{
                            input: "!outline-none"
                        }}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button onPress={handleSubmit} color={"warning"} variant={"flat"} isLoading={isLoading}>Disable User</Button>
                    <Button onPress={handleReset} variant={"light"} color={"danger"} isDisabled={isLoading}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}