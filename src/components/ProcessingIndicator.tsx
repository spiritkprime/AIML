import React from 'react';
import { Brain, Zap, Sparkles } from 'lucide-react';

interface ProcessingIndicatorProps {
  progress: number;
  stage: string;
}

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ progress, stage }) => {
  return (
    <div className="space-y-6">
      {/* ML Processing Animation */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Brain className="w-10 h-10 text-white" />
          </div>
          
          {/* Floating particles */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce">
            <Sparkles className="w-3 h-3 text-white m-0.5" />
          </div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-400 rounded-full animate-bounce delay-300">
            <Zap className="w-3 h-3 text-white m-0.5" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{stage}</span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full bg-white bg-opacity-30 animate-pulse"></div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-gray-600">
        AI is enhancing your image using advanced super-resolution algorithms
      </p>
    </div>
  );
};