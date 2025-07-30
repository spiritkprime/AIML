import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onImageUpload(imageFile);
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
        isDragOver
          ? 'border-blue-400 bg-blue-50 scale-105'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center space-y-4">
        <div className={`p-4 rounded-full transition-colors duration-300 ${
          isDragOver ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          {isDragOver ? (
            <ImageIcon className="w-8 h-8 text-blue-600" />
          ) : (
            <Upload className="w-8 h-8 text-gray-600" />
          )}
        </div>
        
        <div>
          <p className="text-lg font-semibold text-gray-900 mb-2">
            {isDragOver ? 'Drop your image here' : 'Upload low-resolution image'}
          </p>
          <p className="text-sm text-gray-500">
            Drag & drop or click to select • JPG, PNG, WebP • Max 10MB
          </p>
        </div>
      </div>
    </div>
  );
};