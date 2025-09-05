import React from 'react';
import { 
  Lightbulb, 
  Search, 
  BookOpen, 
  ImageIcon, 
  Globe, 
  FileUp,
  Camera,
  Image
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDataActions } from '../store/appStore';

interface AICapabilitiesPanelProps {
  onClose?: () => void;
}

export default function AICapabilitiesPanel({ onClose }: AICapabilitiesPanelProps) {
  const navigate = useNavigate();
  const { addNotification } = useDataActions();
  
  const capabilities = [
    {
      id: 'think-longer',
      icon: <Lightbulb className="w-6 h-6" />,
      name: 'Think longer',
      description: 'Extended analysis for complex problems',
      action: () => {
        addNotification({
          type: 'info',
          title: 'Extended Thinking Activated',
          message: 'Cognis AI is now using deep thinking mode for more comprehensive analysis.'
        });
        if (onClose) onClose();
      }
    },
    {
      id: 'deep-research',
      icon: <Search className="w-6 h-6" />,
      name: 'Deep research',
      description: 'Advanced information gathering across sources',
      action: () => {
        navigate('/agents?mode=research');
        if (onClose) onClose();
      }
    },
    {
      id: 'study-learn',
      icon: <BookOpen className="w-6 h-6" />,
      name: 'Study and learn',
      description: 'Knowledge acquisition and retention',
      action: () => {
        navigate('/knowledge?mode=study');
        if (onClose) onClose();
      }
    },
    {
      id: 'create-image',
      icon: <ImageIcon className="w-6 h-6" />,
      name: 'Create image',
      description: 'Generate images from text descriptions',
      action: () => {
        navigate('/agents?type=image-generator');
        if (onClose) onClose();
      }
    },
    {
      id: 'web-search',
      icon: <Globe className="w-6 h-6" />,
      name: 'Web search',
      description: 'Search the internet for information',
      action: () => {
        navigate('/leads?mode=search');
        if (onClose) onClose();
      }
    },
    {
      id: 'add-files',
      icon: <FileUp className="w-6 h-6" />,
      name: 'Add files',
      description: 'Upload documents to your knowledge base',
      action: () => {
        navigate('/knowledge?action=upload');
        if (onClose) onClose();
      }
    },
    {
      id: 'camera',
      icon: <Camera className="w-6 h-6" />,
      name: 'Camera',
      description: 'Capture and analyze images',
      action: () => {
        navigate('/knowledge?action=camera');
        if (onClose) onClose();
      }
    },
    {
      id: 'photos',
      icon: <Image className="w-6 h-6" />,
      name: 'Photos',
      description: 'Browse and analyze your images',
      action: () => {
        navigate('/knowledge?action=photos');
        if (onClose) onClose();
      }
    }
  ];

  return (
    <div className="bg-gradient-to-b from-background-secondary/80 to-background-primary/90 backdrop-blur-lg rounded-xl p-4 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2 md:gap-3">
        {capabilities.map((capability) => (
          <div
            key={capability.id}
            onClick={capability.action}
            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-lg cursor-pointer"
          >
            <div className="text-primary-400">
              {capability.icon}
            </div>
            <div>
              <p className="font-medium text-white">{capability.name}</p>
              <p className="text-xs text-white/60">{capability.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
