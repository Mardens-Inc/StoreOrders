import React from "react";
import {Icon} from "@iconify-icon/react";
import {Input} from "../extension/Input.tsx";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Textarea} from "@heroui/react";

interface CreateCategoryRequest
{
    name: string;
    description?: string;
    icon?: string;
}

interface CreateCategoryModalProps
{
    isOpen: boolean;
    onOpenChange: () => void;
    categoryFormData: CreateCategoryRequest;
    setCategoryFormData: React.Dispatch<React.SetStateAction<CreateCategoryRequest>>;
    onCreateCategory: () => Promise<void>;
    actionLoading: boolean;
    availableIcons: Array<{ value: string; label: string; icon: string }>;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
                                                                     isOpen,
                                                                     onOpenChange,
                                                                     categoryFormData,
                                                                     setCategoryFormData,
                                                                     onCreateCategory,
                                                                     actionLoading,
                                                                     availableIcons
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
                        <ModalHeader>Create New Category</ModalHeader>
                        <ModalBody className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <Input
                                    label="Category Name"
                                    value={categoryFormData.name}
                                    onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                                    isRequired
                                />
                            </div>
                            <Textarea
                                label="Description"
                                value={categoryFormData.description}
                                onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                            />
                            <Select
                                label="Icon"
                                placeholder="Select an icon"
                                selectedKeys={categoryFormData.icon ? [categoryFormData.icon] : []}
                                onSelectionChange={(keys) =>
                                {
                                    const iconValue = Array.from(keys)[0] as string;
                                    setCategoryFormData({...categoryFormData, icon: iconValue});
                                }}
                                renderValue={(items) =>
                                {
                                    return items.map((item) =>
                                    {
                                        const iconData = availableIcons.find(icon => icon.value === item.key);
                                        return (
                                            <div key={item.key} className="flex items-center gap-2">
                                                <Icon icon={iconData?.icon || "lucide:folder"} className="w-4 h-4"/>
                                                <span>{iconData?.label}</span>
                                            </div>
                                        );
                                    });
                                }}
                            >
                                {availableIcons.map((iconOption) => (
                                    <SelectItem
                                        key={iconOption.value}
                                        startContent={<Icon icon={iconOption.icon} className="w-4 h-4"/>}
                                    >
                                        {iconOption.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={onCreateCategory}
                                isLoading={actionLoading}
                                isDisabled={!categoryFormData.name}
                            >
                                Create Category
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default CreateCategoryModal;
