import { database } from './database';
import { usageService } from './usageService';

interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  width?: number;
  height?: number;
  numberOfImages?: number;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: Date;
  status: 'completed' | 'failed' | 'pending';
}

export class ImageGenerationService {
  private readonly API_KEY = import.meta.env.VITE_STABILITY_API_KEY || '';
  private readonly API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
  
  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImage> {
    // Check usage limits
    const canProceed = await usageService.trackUsage('image_generation');
    
    if (!canProceed) {
      throw new Error('Usage limit exceeded. Please upgrade to continue generating images.');
    }

    try {
      // Create a placeholder record in the database
      const { data: imageRecord, error: dbError } = await database
        .from('generated_images')
        .insert([{
          prompt: options.prompt,
          status: 'pending',
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // In a real implementation, we would call the actual API
      // For now, let's simulate image generation with a placeholder
      const imageId = imageRecord.id;

      // Simulate API delay
      setTimeout(async () => {
        const mockImageUrl = this.getMockImageUrl(options.prompt);
        
        // Update the database with the "generated" image
        await database
          .from('generated_images')
          .update({
            url: mockImageUrl,
            status: 'completed',
          })
          .eq('id', imageId);
      }, 2000);

      // Return the placeholder record
      return {
        id: imageRecord.id,
        url: '',
        prompt: options.prompt,
        createdAt: new Date(),
        status: 'pending'
      };
    } catch (error) {
      console.error('Image generation error:', error);
      throw error;
    }
  }

  async getGeneratedImages(limit = 20, offset = 0): Promise<GeneratedImage[]> {
    try {
      const { data, error } = await database
        .from('generated_images')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return data.map(img => ({
        ...img,
        createdAt: new Date(img.created_at)
      }));
    } catch (error) {
      console.error('Get generated images error:', error);
      return [];
    }
  }

  async getGeneratedImage(id: string): Promise<GeneratedImage | null> {
    try {
      const { data, error } = await database
        .from('generated_images')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Get generated image error:', error);
      return null;
    }
  }

  // Helper to generate placeholder images
  private getMockImageUrl(prompt: string): string {
    // Create a mock image URL based on the prompt
    const encodedPrompt = encodeURIComponent(prompt);
    const width = 1024;
    const height = 1024;
    
    // Use a placeholder image service
    return `https://picsum.photos/${width}/${height}?random=${encodedPrompt}`;
  }

  isConfigured(): boolean {
    return !!this.API_KEY;
  }
}

export const imageGenerationService = new ImageGenerationService();
