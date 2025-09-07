import React, { useEffect, useState } from 'react';
import ApplicationEvolutionManager from './applicationEvolutionManager';

interface AdaptiveUIProps {
  evolutionManager: ApplicationEvolutionManager;
  featureId: string;
  renderDefault: (props: any) => React.ReactNode;
}

export const AdaptiveUI: React.FC<AdaptiveUIProps> = ({ 
  evolutionManager, 
  featureId, 
  renderDefault, 
  ...props 
}) => {
  const [DynamicComponent, setDynamicComponent] = useState<any>(null);
  const [isEvolved, setIsEvolved] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Track how long this component is used
  useEffect(() => {
    return () => {
      const timeSpent = Date.now() - startTime;
      // Record usage statistics when component unmounts
      // This would typically call a method to track feature usage
      console.log(`Component ${featureId} used for ${timeSpent}ms`);
    };
  }, []);
  
  // Listen for component evolutions
  useEffect(() => {
    const onEvolution = (event: any) => {
      if (event.type === 'code_generated' && event.stateId === featureId) {
        // If code was generated for this feature, try to use it
        setIsEvolved(true);
        // In a real implementation, we would dynamically load the component
        // For now, we'll just log that evolution happened
        console.log(`Component ${featureId} evolved!`);
      }
    };
    
    // Subscribe to evolution events
    const unsubscribe = evolutionManager.subscribeToEvolution(onEvolution);
    
    return unsubscribe;
  }, [featureId]);
  
  // For now, always render the default component
  // In a full implementation, this would render dynamically generated components
  return <>{renderDefault(props)}</>;
};

// HOC to make any component adaptive
export function withAdaptiveEvolution(
  Component: React.ComponentType<any>,
  featureId: string,
  evolutionManager: ApplicationEvolutionManager
) {
  return function AdaptiveComponent(props: any) {
    return (
      <AdaptiveUI
        evolutionManager={evolutionManager}
        featureId={featureId}
        renderDefault={(props) => <Component {...props} />}
        {...props}
      />
    );
  };
}
