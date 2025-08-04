import React, { useState, useRef } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { Icon } from '@iconify-icon/react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImageUrl?: string;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, currentImageUrl, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageSelect(imageFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Product Image</label>
      <Card
        className={`cursor-pointer transition-all duration-200 ${
          isDragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400'}`}
        isPressable={!disabled}
        onPress={handleClick}
      >
        <CardBody
          className="p-6"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            {currentImageUrl ? (
              <div className="space-y-4 w-full">
                <div className="flex justify-center">
                  <img
                    src={currentImageUrl}
                    alt="Product preview"
                    className="max-w-32 max-h-32 object-cover rounded-lg border"
                  />
                </div>
                <div className="text-center">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={handleClick}
                    disabled={disabled}
                    startContent={<Icon icon="lucide:edit" className="w-4 h-4" />}
                  >
                    Change Image
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className={`p-4 rounded-full ${isDragOver ? 'bg-primary-100' : 'bg-gray-100'}`}>
                  <Icon 
                    icon="lucide:image-plus" 
                    className={`w-8 h-8 ${isDragOver ? 'text-primary-600' : 'text-gray-400'}`} 
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className={`font-medium ${isDragOver ? 'text-primary-600' : 'text-gray-700'}`}>
                    {isDragOver ? 'Drop image here' : 'Upload Product Image'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Drag and drop an image file here, or click to select
                  </p>
                  <p className="text-xs text-gray-400">
                    Recommended: 308x192 pixels • PNG, JPG, JPEG
                  </p>
                </div>
                <Button
                  variant="bordered"
                  size="sm"
                  disabled={disabled}
                  startContent={<Icon icon="lucide:upload" className="w-4 h-4" />}
                >
                  Choose File
                </Button>
              </>
            )}
          </div>
        </CardBody>
      </Card>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
