import React from "react";
import {Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Spinner, Textarea} from "@heroui/react";
import ImageUpload from "../ImageUpload";

interface Category
{
    id: string;
    name: string;
    description?: string;
    icon?: string;
}

interface CreateProductRequest
{
    name: string;
    description: string;
    sku: string;
    category_id: string;
    image_url?: string;
}

interface EditProductModalProps
{
    isOpen: boolean;
    onOpenChange: () => void;
    formData: CreateProductRequest;
    setFormData: React.Dispatch<React.SetStateAction<CreateProductRequest>>;
    categories: Category[];
    onUpdateProduct: () => Promise<void>;
    onImageSelect: (file: File) => void;
    actionLoading: boolean;
    uploadingImage: boolean;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
                                                               isOpen,
                                                               onOpenChange,
                                                               formData,
                                                               setFormData,
                                                               categories,
                                                               onUpdateProduct,
                                                               onImageSelect,
                                                               actionLoading,
                                                               uploadingImage
                                                           }) =>
{
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="lg"
            scrollBehavior="inside"
            backdrop="blur"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Edit Product</ModalHeader>
                        <ModalBody className="space-y-4">
                            <Input
                                label="Product Name"
                                placeholder="Enter product name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                                isRequired
                            />

                            <Textarea
                                label="Description"
                                placeholder="Enter product description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                                isRequired
                            />

                            <Input
                                label="SKU"
                                placeholder="Enter product SKU"
                                value={formData.sku}
                                onChange={(e) => setFormData(prev => ({...prev, sku: e.target.value}))}
                                isRequired
                            />

                            <Select
                                label="Category"
                                placeholder="Select a category"
                                selectedKeys={formData.category_id ? [formData.category_id] : []}
                                onSelectionChange={(keys) =>
                                {
                                    const selectedKey = Array.from(keys)[0] as string;
                                    setFormData(prev => ({...prev, category_id: selectedKey}));
                                }}
                                isRequired
                            >
                                {categories.map((category) => (
                                    <SelectItem key={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </Select>

                            <ImageUpload
                                onImageSelect={onImageSelect}
                                currentImageUrl={formData.image_url}
                                disabled={uploadingImage}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="danger"
                                variant="light"
                                onPress={onClose}
                                isDisabled={actionLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={onUpdateProduct}
                                isLoading={actionLoading}
                                spinner={<Spinner color="white" size="sm"/>}
                            >
                                Update Product
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default EditProductModal;
