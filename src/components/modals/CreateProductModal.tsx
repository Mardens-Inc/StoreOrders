import React, {useCallback, useEffect, useState} from "react";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Spinner, Textarea, Tooltip} from "@heroui/react";
import ImageUpload from "../ImageUpload";
import {Icon} from "@iconify-icon/react";
import {categoriesApi} from "../../utils/api.ts";
import {Input} from "../extension/Input.tsx";

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
    price: number;
}

interface CreateProductModalProps
{
    isOpen: boolean;
    onOpenChange: () => void;
    formData: CreateProductRequest;
    setFormData: React.Dispatch<React.SetStateAction<CreateProductRequest>>;
    categories: Category[];
    onCreateProduct: () => Promise<void>;
    onImageSelect: (file: File) => void;
    actionLoading: boolean;
    uploadingImage: boolean;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({isOpen, onOpenChange, formData, setFormData, categories, onCreateProduct, onImageSelect, actionLoading, uploadingImage}) =>
{
    const [useCustomSKU, setUseCustomSKU] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

    useEffect(() =>
    {
        if (!formData.category_id)
        {
            setSelectedCategory(undefined);
            return;
        }
        categoriesApi.getCategory(formData.category_id).then(c => c.data).then(setSelectedCategory);
    }, [formData.category_id]);

    useEffect(() =>
    {
        if (useCustomSKU) return;
        generateSKU();
    }, [formData.name, selectedCategory, useCustomSKU]);


    const generateSKU = useCallback(async () =>
    {
        const segmentLength = 3;
        let category = selectedCategory?.name;
        if (category)
        {
            // split category by spaces and grab the first character from each word
            if (category.includes(" "))
                category = category.split(" ").map(word => word.charAt(0)).join("");
            else // if no spaces, just grab the first 3 characters
                category = category.substring(0, category.length > segmentLength ? segmentLength : category.length);
        }
        let name = formData.name.replace(/[^a-zA-Z0-9\s]/g, ""); // remove special characters
        name = name.replace(/(\d+)([a-zA-Z])/g, "$1 $2"); // add space between numbers and letters
        if (name.includes(" ")) name = name.split(" ").map(word => word.substring(0, word.length > segmentLength ? segmentLength : word.length)).join("");
        else name = name.substring(0, name.length > 3 ? 3 : name.length);
        name = name.replace(/\s+/g, "-"); // replace spaces with hyphens

        const timestamp = Date.now().toString(36); // base36 timestamp for uniqueness
        if (!category) category = "UNK";
        const sku = `${category}-${name}#${timestamp}`.toUpperCase();
        setFormData(prev => ({...prev, sku}));
    }, [formData.name, selectedCategory]);

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
                        <ModalHeader>Create New Product</ModalHeader>
                        <ModalBody className="space-y-4">
                            <ImageUpload
                                onImageSelect={onImageSelect}
                                currentImageUrl={formData.image_url}
                                disabled={uploadingImage}
                            />
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

                            <div className={"flex flex-row items-center gap-2"}>

                                <Input
                                    label="SKU"
                                    placeholder="Enter product SKU"
                                    value={formData.sku}
                                    onChange={(e) => setFormData(prev => ({...prev, sku: e.target.value}))}
                                    isRequired={useCustomSKU}
                                    variant={useCustomSKU ? undefined : "bordered"}
                                    isDisabled={!useCustomSKU}
                                />
                                <Tooltip content={useCustomSKU ? "Use auto-generated SKU" : "Use custom SKU"}>
                                    <Button isIconOnly onPress={() => setUseCustomSKU(prev => !prev)} variant={"flat"} color={useCustomSKU ? "primary" : "default"}>
                                        <Icon icon={useCustomSKU ? "mage:unlocked-fill" : "mage:lock-fill"} height={18}/>
                                    </Button>
                                </Tooltip>
                            </div>

                            <Input
                                type="number"
                                label="Price"
                                placeholder="0.00"
                                value={formData.price?.toString() ?? ""}
                                onChange={(e) => setFormData(prev => ({...prev, price: parseFloat(e.target.value) || 0}))}
                                isRequired
                                min={0}
                                step={0.01}
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
                                onPress={onCreateProduct}
                                isLoading={actionLoading}
                                spinner={<Spinner color="white" size="sm"/>}
                            >
                                Create Product
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default CreateProductModal;
