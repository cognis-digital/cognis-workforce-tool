import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

/**
 * Cognis Digital LLC Logo Component
 * Updated branding with Evolution Architecture emphasis
 */
const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showText = true,
  className = ''
}) => {
  // Size mappings
  const sizeMap = {
    small: { icon: 24, fontSize: 'text-sm' },
    medium: { icon: 32, fontSize: 'text-base' },
    large: { icon: 48, fontSize: 'text-xl' }
  };
  
  const { icon, fontSize } = sizeMap[size];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-700 p-1 shadow-lg">
          <svg 
            width={icon} 
            height={icon} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            {/* Stylized "C" for Cognis with AI-inspired geometric elements */}
            <path 
              d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="rgba(255,255,255,0.1)" 
            />
            <path 
              d="M15 8.5C13.8 7.3 12.3 6.8 10.85 7C8.2 7.4 6 10 6 12.8C6 15.5 7.95 18 10.85 18C12.55 18 14.05 17.3 15 16.1" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />
            {/* Evolution Architecture symbol */}
            <path 
              d="M12 7.5V9.5M12 14.5V16.5M9.5 12H14.5" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
            />
          </svg>
        </div>
        {/* Small evolution indicator */}
        <div className="absolute -bottom-1 -right-1 rounded-full bg-blue-500 w-3 h-3 border border-white"></div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold leading-none ${fontSize} text-white`}>
            Cognis Digital
          </span>
          <span className={`text-xs opacity-80 text-white leading-tight`}>
            Local AI Chat Interface
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
