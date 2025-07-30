import React, { useState, useCallback, useRef } from 'react';
import { Sparkles, Brain, AlertCircle } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { ImageComparison } from './components/ImageComparison';
import { ProcessingIndicator } from './components/ProcessingIndicator';
import { mlEnhancer } from './utils/mlEnhancer';
import { 
  loadImageFromFile, 
  imageToCanvas, 
  canvasToImageData, 
  imageDataToCanvas, 
  downloadImage 
} from './utils/imageUtils';

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  stage: string;
}

function App() {
  const [originalImage, setOriginalImage] = useState<string>('');
  const [enhancedImage, setEnhancedImage] = useState<string>('');
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    stage: ''
  });
  const [error, setError] = useState<string>('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const enhancedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const initializeModel = useCallback(async () => {
    if (isModelLoaded) return;
    
    try {
      setProcessingState({
        isProcessing: true,
        progress: 0,
        stage: 'Loading AI model...'
      });

      await mlEnhancer.initialize((progress) => {
        setProcessingState(prev => ({
          ...prev,
          progress,
          stage: progress < 50 ? 'Loading AI model...' : 'Optimizing for your device...'
        }));
      });

      setIsModelLoaded(true);
      setProcessingState({
        isProcessing: false,
        progress: 100,
        stage: 'Ready!'
      });
    } catch (err) {
      setError('Failed to load AI model. Please refresh and try again.');
      setProcessingState({
        isProcessing: false,
        progress: 0,
        stage: ''
      });
    }
  }, [isModelLoaded]);

  const handleImageUpload = useCallback(async (file: File) => {
    setError('');
    
    try {
      // Initialize model if not already loaded
      if (!isModelLoaded) {
        await initializeModel();
      }

      setProcessingState({
        isProcessing: true,
        progress: 0,
        stage: 'Loading image...'
      });

      // Load and process the image
      const img = await loadImageFromFile(file);
      const canvas = imageToCanvas(img, 1024);
      const imageData = canvasToImageData(canvas);
      
      // Set original image for display
      setOriginalImage(canvas.toDataURL());
      
      setProcessingState(prev => ({
        ...prev,
        progress: 20,
        stage: 'Preparing for enhancement...'
      }));

      // Enhance the image using ML
      const enhancedImageData = await mlEnhancer.enhanceImage(
        imageData,
        (progress, stage) => {
          setProcessingState(prev => ({
            ...prev,
            progress: 20 + (progress * 0.8), // Scale to 20-100%
            stage
          }));
        }
      );

      // Convert enhanced image back to displayable format
      const enhancedCanvas = imageDataToCanvas(enhancedImageData);
      enhancedCanvasRef.current = enhancedCanvas;
      setEnhancedImage(enhancedCanvas.toDataURL());
      
      setProcessingState({
        isProcessing: false,
        progress: 100,
        stage: 'Enhancement complete!'
      });

    } catch (err) {
      console.error('Image enhancement failed:', err);
      setError('Failed to enhance image. Please try with a different image.');
      setProcessingState({
        isProcessing: false,
        progress: 0,
        stage: ''
      });
    }
  }, [isModelLoaded, initializeModel]);

  const handleDownload = useCallback(() => {
    if (enhancedCanvasRef.current) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      downloadImage(enhancedCanvasRef.current, `enhanced-image-${timestamp}.png`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Image Enhancer
            </h1>
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform low-resolution images into high-quality masterpieces using advanced machine learning algorithms
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!originalImage ? (
            <div className="space-y-8">
              <ImageUploader 
                onImageUpload={handleImageUpload}
                isProcessing={processingState.isProcessing}
              />
              
              {processingState.isProcessing && (
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <ProcessingIndicator 
                    progress={processingState.progress}
                    stage={processingState.stage}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {processingState.isProcessing ? (
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <ProcessingIndicator 
                    progress={processingState.progress}
                    stage={processingState.stage}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <ImageComparison
                    originalImage={originalImage}
                    enhancedImage={enhancedImage}
                    onDownload={handleDownload}
                    isProcessing={processingState.isProcessing}
                  />
                </div>
              )}
              
              {/* Upload Another Button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setOriginalImage('');
                    setEnhancedImage('');
                    setError('');
                    setProcessingState({
                      isProcessing: false,
                      progress: 0,
                      stage: ''
                    });
                  }}
                  className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-200"
                >
                  Enhance Another Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white bg-opacity-50 rounded-2xl border border-white border-opacity-60 backdrop-blur-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Enhancement</h3>
            <p className="text-gray-600 text-sm">Advanced neural networks analyze and enhance every pixel</p>
          </div>
          
          <div className="text-center p-6 bg-white bg-opacity-50 rounded-2xl border border-white border-opacity-60 backdrop-blur-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Processing</h3>
            <p className="text-gray-600 text-sm">Fast, browser-based ML processing without uploads</p>
          </div>
          
          <div className="text-center p-6 bg-white bg-opacity-50 rounded-2xl border border-white border-opacity-60 backdrop-blur-sm">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy First</h3>
            <p className="text-gray-600 text-sm">All processing happens locally - your images never leave your device</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;