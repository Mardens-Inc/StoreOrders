import React from "react";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem} from "@heroui/react";
import {Input} from "../extension/Input.tsx";

interface Store
{
    id: string;
    city?: string;
    address?: string;
}

interface CreateUserRequest
{
    email: string;
    role: "store" | "admin";
    store_id?: string;
}

interface CreateUserModalProps
{
    isOpen: boolean;
    onOpenChange: () => void;
    formData: CreateUserRequest;
    setFormData: (data: CreateUserRequest) => void;
    stores: Store[];
    onCreateUser: () => void;
    actionLoading: boolean;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
                                                             isOpen,
                                                             onOpenChange,
                                                             formData,
                                                             setFormData,
                                                             stores,
                                                             onCreateUser,
                                                             actionLoading
                                                         }) =>
{
    const getStoreName = (storeId?: string) =>
    {
        if (!storeId) return "N/A";
        const store = stores.find(s => s.id === storeId);
        return store ? `${store.city || "Unknown"} - ${store.address || "No address"}` : "Unknown Store";
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="md"
            backdrop="blur"
            scrollBehavior="inside"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Create New User</ModalHeader>
                        <ModalBody className="space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                isRequired
                            />
                            <Select
                                label="Role"
                                selectedKeys={[formData.role]}
                                onSelectionChange={(keys) =>
                                {
                                    const role = Array.from(keys)[0] as "store" | "admin";
                                    setFormData({...formData, role});
                                }}
                            >
                                <SelectItem key="store">Store User</SelectItem>
                                <SelectItem key="admin">Administrator</SelectItem>
                            </Select>
                            {formData.role === "store" && (
                                <Select
                                    label="Store"
                                    selectedKeys={formData.store_id ? [formData.store_id] : []}
                                    onSelectionChange={(keys) =>
                                    {
                                        const storeId = Array.from(keys)[0] as string;
                                        setFormData({...formData, store_id: storeId});
                                    }}
                                >
                                    {stores.map((store) => (
                                        <SelectItem key={store.id}>
                                            {getStoreName(store.id)}
                                        </SelectItem>
                                    ))}
                                </Select>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={onCreateUser}
                                isLoading={actionLoading}
                                isDisabled={!formData.email}
                            >
                                Create User
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default CreateUserModal;
