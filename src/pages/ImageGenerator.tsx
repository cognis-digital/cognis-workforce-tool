import React, { useState } from 'react';
import { ImageIcon, Loader2 as LoaderCircle, Download, Trash2, History, PlusCircle, Lightbulb } from 'lucide-react';
import { imageGenerationService } from '../services/imageGenerationService';
import { useDataActions } from '../store/appStore';
import PaygateWrapper from '../components/PaygateWrapper';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [style, setStyle] = useState('realistic');
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [imageSize, setImageSize] = useState('1:1');
  const { addNotification } = useDataActions();
  const [thinkingMode, setThinkingMode] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');

  // Image size options
  const imageSizeOptions = [
    { label: '1:1', value: '1:1', width: 1024, height: 1024 },
    { label: '16:9', value: '16:9', width: 1920, height: 1080 },
    { label: '9:16', value: '9:16', width: 1080, height: 1920 },
    { label: '4:3', value: '4:3', width: 1280, height: 960 },
  ];

  // Style options
  const styleOptions = [
    { label: 'Realistic', value: 'realistic' },
    { label: 'Digital Art', value: 'digital-art' },
    { label: 'Photographic', value: 'photographic' },
    { label: 'Anime', value: 'anime' },
    { label: 'Cinematic', value: 'cinematic' },
    { label: '3D Render', value: '3d-render' },
    { label: 'Cartoon', value: 'cartoon' },
  ];

  const selectedSize = imageSizeOptions.find(option => option.value === imageSize) || imageSizeOptions[0];

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setError('');
    setGeneratingImage(true);
    try {
      const promptToUse = thinkingMode ? enhancedPrompt || prompt : prompt;
      
      const result = await imageGenerationService.generateImage({
        prompt: promptToUse,
        negativePrompt: negativePrompt,
        style: advancedMode ? style : undefined,
        width: selectedSize.width,
        height: selectedSize.height,
      });

      setGeneratedImages([result, ...generatedImages]);
      
      addNotification({
        type: 'success',
        title: 'Image Generated',
        message: 'Your image has been successfully generated.'
      });
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || 'Failed to generate image');
      
      addNotification({
        type: 'error',
        title: 'Image Generation Failed',
        message: err.message || 'An error occurred while generating your image.'
      });
    } finally {
      setGeneratingImage(false);
      setThinkingMode(false);
      setEnhancedPrompt('');
    }
  };

  const handleThinkLonger = () => {
    setThinkingMode(true);
    
    // Simulate AI thinking about the prompt and enhancing it
    const originalPrompt = prompt;
    setGeneratingImage(true);
    
    setTimeout(() => {
      // Enhance the prompt with more detailed descriptions
      const enhancedPromptText = `${originalPrompt}, highly detailed, professional lighting, realistic textures, 8k resolution, cinematic composition, dramatic lighting, photorealistic quality`;
      setEnhancedPrompt(enhancedPromptText);
      setGeneratingImage(false);
      
      addNotification({
        type: 'info',
        title: 'Extended Thinking Complete',
        message: 'Prompt has been enhanced for better image quality.'
      });
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-bold text-text-heading mb-2">Image Generator</h1>
      <p className="text-text-body mb-8">Create custom images using Cognis AI technology</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Generation Controls */}
        <div className="md:col-span-1 space-y-6">
          <div className="card-bg rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text-heading mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Image Controls
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create..."
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px]"
                />
              </div>

              {thinkingMode && enhancedPrompt && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-primary-400 mb-2">
                    <Lightbulb className="w-4 h-4" />
                    Enhanced Prompt
                  </div>
                  <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl px-4 py-3 text-white/90 text-sm">
                    {enhancedPrompt}
                  </div>
                </div>
              )}

              {advancedMode && (
                <>
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Negative Prompt</label>
                    <textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="Describe what to exclude from the image..."
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">Style</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {styleOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-white/60 text-sm mb-2">Image Size</label>
                <div className="flex flex-wrap gap-2">
                  {imageSizeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setImageSize(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        imageSize === option.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm py-2">{error}</div>
              )}

              <div className="flex flex-col gap-4">
                <PaygateWrapper 
                  action="image_generation"
                  children={
                    <button
                      onClick={handleGenerateImage}
                      disabled={generatingImage || !prompt.trim()}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-400 text-white px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {generatingImage && !thinkingMode ? (
                        <>
                          <LoaderCircle className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5" />
                          Generate Image
                        </>
                      )}
                    </button>
                  }
                />

                <PaygateWrapper 
                  action="image_generation"
                  children={
                    <button
                      onClick={handleThinkLonger}
                      disabled={generatingImage || !prompt.trim()}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {thinkingMode && generatingImage ? (
                        <>
                          <LoaderCircle className="w-5 h-5 animate-spin" />
                          Thinking...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-5 h-5" />
                          Think Longer
                        </>
                      )}
                    </button>
                  }
                />

                <button
                  onClick={() => setAdvancedMode(!advancedMode)}
                  className="text-white/60 hover:text-white transition-colors text-sm"
                >
                  {advancedMode ? 'Hide Advanced Options' : 'Show Advanced Options'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Images */}
        <div className="md:col-span-2">
          <div className="card-bg rounded-2xl p-6">
            <h2 className="text-xl font-bold text-text-heading mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Generated Images
              </span>
              <button
                onClick={() => setGeneratedImages([])}
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </h2>

            {generatedImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {generatedImages.map((image, index) => (
                  <div key={image.id || index} className="relative group">
                    <div className="bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden aspect-square">
                      {image.url ? (
                        <img
                          src={image.url}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <LoaderCircle className="w-8 h-8 text-primary-400 animate-spin" />
                        </div>
                      )}
                    </div>
                    {image.url && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-xl flex items-center justify-center gap-4">
                        <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center">
                          <Download className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 text-center">
                <ImageIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Images Yet</h3>
                <p className="text-white/60 mb-6">
                  Enter a prompt and generate your first image
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
