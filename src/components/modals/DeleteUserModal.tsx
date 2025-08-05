import React from "react";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";

interface User {
    id: string;
    email: string;
    role: "store" | "admin";
    store_id?: string;
    created_at: string;
}

interface DeleteUserModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    selectedUser: User | null;
    onDeleteUser: () => void;
    actionLoading: boolean;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
    isOpen,
    onOpenChange,
    selectedUser,
    onDeleteUser,
    actionLoading
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            scrollBehavior="inside"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Delete User</ModalHeader>
                        <ModalBody>
                            <p>
                                Are you sure you want to delete the user <strong>{selectedUser?.email}</strong>?
                                This action cannot be undone.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                onPress={onDeleteUser}
                                isLoading={actionLoading}
                            >
                                Delete User
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default DeleteUserModal;
