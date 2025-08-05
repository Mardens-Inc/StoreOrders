import React from 'react';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

interface Category {
    id: string;
    name: string;
    description?: string;
    icon?: string;
}

interface DeleteCategoryModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    selectedCategory: Category | null;
    onDeleteCategory: () => Promise<void>;
    actionLoading: boolean;
}

const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
    isOpen,
    onOpenChange,
    selectedCategory,
    onDeleteCategory,
    actionLoading
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            scrollBehavior="inside"
            backdrop="blur"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Delete Category</ModalHeader>
                        <ModalBody>
                            <p>
                                Are you sure you want to delete the category <strong>{selectedCategory?.name}</strong>?
                                This action cannot be undone.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                onPress={onDeleteCategory}
                                isLoading={actionLoading}
                            >
                                Delete Category
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default DeleteCategoryModal;
