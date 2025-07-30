import React, { useState, useRef, useCallback } from 'react';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageComparisonProps {
  originalImage: string;
  enhancedImage: string;
  onDownload: () => void;
  isProcessing: boolean;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalImage,
  enhancedImage,
  onDownload,
  isProcessing
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSliderMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onDownload}
          disabled={isProcessing}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Download Enhanced</span>
        </button>
      </div>

      {/* Image Comparison */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl cursor-col-resize shadow-2xl"
        onMouseMove={handleSliderMove}
        style={{ height: '500px' }}
      >
        {/* Enhanced Image (Background) */}
        <div className="absolute inset-0">
          <img
            src={enhancedImage}
            alt="Enhanced"
            className="w-full h-full object-contain"
            style={{ transform: `scale(${zoom})` }}
          />
          <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
            Enhanced
          </div>
        </div>

        {/* Original Image (Foreground with clip) */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={originalImage}
            alt="Original"
            className="w-full h-full object-contain"
            style={{ transform: `scale(${zoom})` }}
          />
          <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
            Original
          </div>
        </div>

        {/* Slider Line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-col-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="w-1 h-6 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Slider Instructions */}
      <p className="text-center text-sm text-gray-600">
        Move the slider to compare original vs enhanced image
      </p>
    </div>
  );
};