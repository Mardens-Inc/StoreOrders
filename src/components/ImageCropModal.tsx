import {createRef, useEffect, useState} from "react";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import Cropper, {ReactCropperElement} from "react-cropper";
import {resizeImage} from "../utils/image-resizer";
import "../assets/css/cropper.min.css";

interface ImageCropModalProps
{
    image: File | null;
    isOpen: boolean;
    onClose: (croppedFile: File | null) => void;
    aspectRatio?: number;
    cropWidth?: number;
    cropHeight?: number;
}

export default function ImageCropModal({
                                           image,
                                           isOpen,
                                           onClose,
                                           aspectRatio = 308 / 192, // Default to 308x192 ratio
                                           cropWidth = 308,
                                           cropHeight = 192
                                       }: ImageCropModalProps)
{
    const cropperRef = createRef<ReactCropperElement>();
    const [imageUrl, setImageUrl] = useState<string>("");


    useEffect(() =>
    {
        if (image)
        {
            const url = URL.createObjectURL(image);
            setImageUrl(url);

            // Cleanup previous URL
            return () =>
            {
                if (imageUrl)
                {
                    URL.revokeObjectURL(imageUrl);
                }
            };
        } else
        {
            setImageUrl("");
        }
    }, [image]);

    const handleCancel = () =>
    {
        onClose(null);
    };

    const handleCrop = async () =>
    {
        if (cropperRef.current && cropperRef.current.cropper)
        {
            try
            {
                const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas({
                    width: cropWidth,
                    height: cropHeight
                });

                // Convert canvas to blob
                croppedCanvas.toBlob(async (blob: Blob | null) =>
                {
                    if (blob && image)
                    {
                        // Create a new file with the cropped data
                        const fileName = `product_${Date.now()}.png`;
                        const croppedFile = new File([blob], fileName, {
                            type: "image/png",
                            lastModified: Date.now()
                        });

                        // Resize to exact dimensions if needed
                        try
                        {
                            const resizedFile = await resizeImage(croppedFile, cropWidth, cropHeight);
                            onClose(resizedFile);
                        } catch (error)
                        {
                            console.error("Error resizing image:", error);
                            onClose(croppedFile); // Fallback to non-resized
                        }
                    }
                }, "image/png", 0.9);
            } catch (error)
            {
                console.error("Error cropping image:", error);
                onClose(null);
            }
        }
    };


    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => !open && handleCancel()}
            size="2xl"
            backdrop="blur"
        >
            <ModalContent>
                <ModalHeader>
                    <h3>Crop Product Image</h3>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Crop your image to {cropWidth}x{cropHeight} pixels for optimal display.
                        </p>
                        {imageUrl && (
                            <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                                <Cropper
                                    ref={cropperRef}
                                    src={imageUrl}
                                    style={{height: "100%", width: "100%"}}
                                    aspectRatio={aspectRatio}
                                    guides={true}
                                    viewMode={1}
                                    dragMode="move"
                                    scalable={true}
                                    cropBoxMovable={true}
                                    cropBoxResizable={true}
                                    background={false}
                                    autoCropArea={0.8}
                                    checkOrientation={false}
                                />
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        variant="light"
                        onPress={handleCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleCrop}
                        isDisabled={!imageUrl}
                    >
                        Crop & Save
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}