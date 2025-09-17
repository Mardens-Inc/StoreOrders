import {Accordion, AccordionItem, Button, Link, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useEffect, useState} from "react";
import {StoreOption} from "../../utils/types.ts";
import {ApiResponse, storesApi} from "../../utils/api.ts";
import {useAuth} from "../../providers/AuthProvider.tsx";

type HelpProperties = {
    isOpen: boolean;
    onClose: () => void;
};

export function HelpModal(props: HelpProperties)
{
    const {user} = useAuth();
    const [store, setStore] = useState<StoreOption | null>(null);
    const role = user?.role; // "admin" | "store"
    useEffect(() =>
    {
        (async () =>
        {
            try
            {
                const resp = await storesApi.getStores();
                const data = (resp as ApiResponse).data as any[];
                const stores = (data || []).map(s => ({id: s.id, city: s.city ?? null, address: s.address ?? null}));
                if (user?.store_id) setStore(stores.find(i => i.id === user?.store_id) || null);
            } catch (e)
            {
                console.error("Failed to load stores", e);
            }
        })();
    }, [role, user?.store_id]);
    const helpSections = [
        {
            title: "Getting Started",
            content: (
                <div className="space-y-2">
                    <p>Welcome to the <span className={"text-primary underline font-bold"}>Marden's Store Ordering Portal</span>! Here are some basics to get you started:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Browse products by navigating to the Categories section</li>
                        <li>Add items to your cart by clicking the "Add to Cart" button</li>
                        <li>Review your cart and proceed to checkout when ready</li>
                    </ul>
                </div>
            )
        },
        {
            title: "Managing Your Cart",
            content: (
                <div className="space-y-2">
                    <p>Your shopping cart is easy to manage:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Adjust quantities using the + and - buttons</li>
                        <li>Remove items using the trash icon</li>
                        <li>Clear your entire cart with the "Clear Cart" button</li>
                        <li>Continue shopping or proceed to checkout from the cart sidebar</li>
                    </ul>
                </div>
            )
        },
        {
            title: "Contact Support",
            content: (
                <div className="space-y-3">
                    <p>Need additional help? Contact our support team:</p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Icon icon="lucide:mail" className="w-4 h-4"/>
                            <Link
                                href={`mailto:helpdesk@mardens.com?subject=Store Ordering Portal Support Request&body=${encodeURIComponent(
                                    `Please provide the following information:
                                    1. Store Location: ${store?.city}
                                    2. Issue Description:
                                    3. Steps to Reproduce:
                                    4. Expected Behavior:
                                    5. Additional Notes:
                                    
                                    --- System Information ---
                                    Browser: ${navigator.userAgent}
                                    Time of Report: ${new Date().toLocaleString()} 
                                    `
                                )}`}
                                target={"_blank"}
                            >
                                helpdesk@mardens.com
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <Icon icon="lucide:phone" className="w-4 h-4"/>
                            <span>Ext: 2206</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Icon icon="lucide:clock" className="w-4 h-4"/>
                            <span>Available Monday-Friday, 8:00AM - 4:30PM EST</span>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <Modal
            isOpen={props.isOpen}
            onClose={props.onClose}
            size="lg"
            backdrop="blur"
            scrollBehavior="inside"
        >
            <ModalContent>
                {onClose => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon="lucide:help-circle" className="w-5 h-5"/>
                            Help & Support
                        </ModalHeader>
                        <ModalBody>
                            <Accordion
                                selectionBehavior={"replace"}
                                variant="bordered"
                                selectionMode="multiple"
                                defaultSelectedKeys={["0"]}
                            >
                                {helpSections.map((section, index) => (
                                    <AccordionItem
                                        key={index}
                                        title={section.title}
                                        className="text-base"
                                    >
                                        {section.content}
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={onClose}
                                className="min-h-[44px]"
                            >
                                Close
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}