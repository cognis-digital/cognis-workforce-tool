import React from 'react';
import Logo from '../branding/Logo';

export type AudienceType = 'developer' | 'investor' | 'business' | 'individual';

interface TargetedMessagingProps {
  audience?: AudienceType;
  showAll?: boolean;
  className?: string;
}

/**
 * TargetedMessaging Component
 * Provides tailored messaging for different audience segments using Evolution Architecture
 */
const TargetedMessaging: React.FC<TargetedMessagingProps> = ({
  audience = 'business',
  showAll = false,
  className = ''
}) => {
  // Core brand messaging
  const coreBranding = {
    tagline: "AI-Powered Workforce Evolution",
    mainValue: "Transform your organization with self-evolving AI solutions"
  };

  // Targeted content for each audience
  const messaging: Record<AudienceType, {
    heading: string;
    subheading: string;
    benefits: string[];
    callToAction: string;
    technicalSpecs?: string[];
    financials?: string[];
    roi?: string;
  }> = {
    developer: {
      heading: "Cutting-Edge Technology for AI Engineers",
      subheading: "Build, deploy, and evolve intelligent systems with our time-series architecture",
      benefits: [
        "Implement complex state management with complete history tracking",
        "Create self-evolving UI components that adapt to usage patterns",
        "Leverage blockchain integration for verifiable AI interactions",
        "Apply recursive programming patterns for elegant, maintainable code"
      ],
      callToAction: "Explore our technical documentation",
      technicalSpecs: [
        "TypeScript + React with advanced hooks and patterns",
        "Time-series state architecture with snapshot capabilities",
        "Polymorphic code generation for adaptive UIs",
        "Zero-config multi-agent orchestration"
      ]
    },
    investor: {
      heading: "Unparalleled Growth in Enterprise AI",
      subheading: "Invest in the next generation of adaptive business intelligence",
      benefits: [
        "Rapidly expanding market with 112% YoY growth",
        "Proprietary technology with multiple patent applications",
        "Enterprise-ready solution with Fortune 500 clients",
        "Recurring revenue model with 94% retention rate"
      ],
      callToAction: "View our investor deck",
      financials: [
        "$8.7M ARR with 3.2x YoY growth",
        "78% gross margin with path to 85%",
        "$42M serviceable market expanding to $157M by 2027",
        "16-month payback period on customer acquisition"
      ]
    },
    business: {
      heading: "Transform Your Business Operations",
      subheading: "Harness the power of evolving AI to optimize workflows and drive growth",
      benefits: [
        "Reduce operational costs by up to 37%",
        "Improve decision quality with AI-augmented intelligence",
        "Scale customer support without increasing headcount",
        "Gain competitive insights with deep knowledge processing"
      ],
      callToAction: "Schedule a demo",
      roi: "Our clients achieve an average ROI of 342% within the first 18 months"
    },
    individual: {
      heading: "Your Personal AI Workforce",
      subheading: "Experience the future of AI assistance tailored just for you",
      benefits: [
        "Get personalized AI assistance that learns your preferences",
        "Build your knowledge base with verified information",
        "Connect securely with blockchain verification",
        "Join a community of forward-thinking AI enthusiasts"
      ],
      callToAction: "Start your free trial",
    }
  };

  // Get content for current audience
  const content = messaging[audience];

  // Function to render a specific audience section
  const renderAudienceSection = (type: AudienceType) => {
    const audienceContent = messaging[type];
    
    return (
      <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 rounded-xl p-6 shadow-lg border border-gray-700/50">
        <div className="mb-4 inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold">
          For {type.charAt(0).toUpperCase() + type.slice(1) + 's'}
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">{audienceContent.heading}</h2>
        <p className="text-gray-300 mb-4">{audienceContent.subheading}</p>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Key Benefits</h3>
          <ul className="space-y-2">
            {audienceContent.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mr-2 mt-1 text-green-400">•</span>
                <span className="text-gray-300">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {type === 'developer' && audienceContent.technicalSpecs && (
          <div className="mb-4 bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
            <h3 className="text-sm font-semibold text-indigo-300 mb-2">Technical Specifications</h3>
            <ul className="space-y-1 text-sm">
              {audienceContent.technicalSpecs.map((spec, idx) => (
                <li key={idx} className="text-gray-300">{spec}</li>
              ))}
            </ul>
          </div>
        )}

        {type === 'investor' && audienceContent.financials && (
          <div className="mb-4 bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
            <h3 className="text-sm font-semibold text-green-400 mb-2">Financial Highlights</h3>
            <ul className="space-y-1 text-sm">
              {audienceContent.financials.map((item, idx) => (
                <li key={idx} className="text-gray-300">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {type === 'business' && audienceContent.roi && (
          <div className="mb-4 bg-gray-800/50 p-3 rounded-lg border border-gray-700/50 text-center">
            <h3 className="text-sm font-semibold text-yellow-400 mb-1">ROI Impact</h3>
            <p className="text-white font-bold">{audienceContent.roi}</p>
          </div>
        )}
        
        <button className="mt-2 w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex justify-center items-center">
          {audienceContent.callToAction}
        </button>
      </div>
    );
  };

  return (
    <div className={`targeted-messaging ${className}`}>
      {/* Header section with logo and core messaging */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="large" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{coreBranding.tagline}</h1>
        <p className="text-xl text-gray-300">{coreBranding.mainValue}</p>
      </div>

      {/* Audience-specific or all messaging */}
      {showAll ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(messaging) as AudienceType[]).map(audienceType => (
            <div key={audienceType}>
              {renderAudienceSection(audienceType)}
            </div>
          ))}
        </div>
      ) : (
        renderAudienceSection(audience)
      )}
      
      {/* Evolution architecture highlight */}
      <div className="mt-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-lg border border-blue-800/30 flex items-center">
        <div className="mr-4">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-blue-300 font-semibold">Powered by Evolution Architecture</h3>
          <p className="text-gray-300 text-sm">Our time-series state management system enables applications to learn, adapt, and evolve.</p>
        </div>
      </div>
    </div>
  );
};

export default TargetedMessaging;
