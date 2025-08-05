import React from 'react';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { Product } from '../../providers/CartProvider';

interface DeleteProductModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    selectedProduct: Product | null;
    onDeleteProduct: () => Promise<void>;
    actionLoading: boolean;
}

const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
    isOpen,
    onOpenChange,
    selectedProduct,
    onDeleteProduct,
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
                        <ModalHeader>Delete Product</ModalHeader>
                        <ModalBody>
                            <p>
                                Are you sure you want to delete the product <strong>{selectedProduct?.name}</strong>?
                                This action cannot be undone.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                onPress={onDeleteProduct}
                                isLoading={actionLoading}
                            >
                                Delete Product
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default DeleteProductModal;
