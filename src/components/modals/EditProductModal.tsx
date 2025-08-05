import React from 'react';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Spinner, Textarea } from '@heroui/react';
import ImageUpload from '../ImageUpload';

interface Category {
    id: string;
    name: string;
    description?: string;
    icon?: string;
}

interface CreateProductRequest {
    name: string;
    description: string;
    sku: string;
    price: number;
    category_id: string;
    image_url?: string;
    stock_quantity: number;
}

interface EditProductModalProps {
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
}) => {
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Product Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    isRequired
                                />
                                <Input
                                    label="SKU"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                    isRequired
                                />
                            </div>
                            <Textarea
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                isRequired
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Price"
                                    type="number"
                                    step="0.01"
                                    value={formData.price.toString()}
                                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                                    startContent={<span className="text-gray-500">$</span>}
                                    isRequired
                                />
                                <Input
                                    label="Stock Quantity"
                                    type="number"
                                    value={formData.stock_quantity.toString()}
                                    onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})}
                                    isRequired
                                />
                            </div>
                            <Select
                                label="Category"
                                selectedKeys={formData.category_id ? [formData.category_id] : []}
                                onSelectionChange={(keys) => {
                                    const categoryId = Array.from(keys)[0] as string;
                                    setFormData({...formData, category_id: categoryId});
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
                            {uploadingImage && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Spinner size="sm"/>
                                    <span>Uploading image...</span>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={onUpdateProduct}
                                isLoading={actionLoading}
                                isDisabled={!formData.name || !formData.sku || !formData.category_id}
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
