import React, { useEffect, useState } from 'react';
import evolutionManager from './applicationEvolutionManager';

interface AdaptiveUIProps {
  evolutionManager: typeof evolutionManager;
  featureId: string;
  renderDefault: (props: any) => React.ReactNode;
  usageTracking?: boolean;
}

/**
 * AdaptiveUI
 * A component that can adapt and evolve based on usage patterns
 */
export const AdaptiveUI: React.FC<AdaptiveUIProps> = ({ 
  evolutionManager, 
  featureId, 
  renderDefault, 
  usageTracking = true,
  ...props 
}) => {
  const [DynamicComponent, setDynamicComponent] = useState<any>(null);
  const [isEvolved, setIsEvolved] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Track how long this component is used
  useEffect(() => {
    if (!usageTracking) return;
    
    return () => {
      const timeSpent = Date.now() - startTime;
      // Record usage statistics when component unmounts
      console.log(`Component ${featureId} used for ${timeSpent}ms`);
    };
  }, [featureId, startTime, usageTracking]);
  
  // Listen for evolution events
  useEffect(() => {
    const onEvolution = (event: any) => {
      if (event.type === 'code_generated' && event.stateId === featureId) {
        // If code was generated for this feature, try to use it
        setIsEvolved(true);
        try {
          // In a real implementation, we would dynamically load the component
          // For now we'll just log that evolution happened
          console.log(`Component ${featureId} evolved!`);
          
          // For demonstration, we'll just use a higher-order component
          // In a real implementation, this would be replaced with the generated component
          setDynamicComponent(() => (props: any) => {
            return (
              <div className="evolved-component">
                <div className="evolution-indicator">
                  <span className="badge">Evolved</span>
                </div>
                {renderDefault(props)}
              </div>
            );
          });
        } catch (error) {
          console.error(`Failed to load evolved component for ${featureId}`, error);
          setIsEvolved(false);
        }
      }
    };
    
    // Subscribe to evolution events
    const unsubscribe = evolutionManager.subscribeToEvolution(onEvolution);
    
    return unsubscribe;
  }, [featureId, evolutionManager, renderDefault]);
  
  // If evolved, render the dynamic component, otherwise render the default
  if (isEvolved && DynamicComponent) {
    return <DynamicComponent {...props} />;
  }
  
  return <>{renderDefault(props)}</>;
};

/**
 * Higher-order component to make any component adaptive
 * @param Component The component to enhance
 * @param featureId Unique identifier for this feature
 * @param evolutionManager Evolution manager instance
 * @returns Adaptive version of the component
 */
export function withAdaptiveEvolution(
  Component: React.ComponentType<any>,
  featureId: string,
  evolutionManager: typeof evolutionManager,
  usageTracking = true
) {
  return function AdaptiveComponent(props: any) {
    return (
      <AdaptiveUI
        evolutionManager={evolutionManager}
        featureId={featureId}
        renderDefault={(props) => <Component {...props} />}
        usageTracking={usageTracking}
        {...props}
      />
    );
  };
}

/**
 * Hook to connect a component to the evolution system
 * @param featureId Unique identifier for this feature
 * @returns Object with evolution-related utilities
 */
export function useEvolution(featureId: string) {
  const [evolutionCount, setEvolutionCount] = useState(0);
  
  useEffect(() => {
    const handleEvolution = (event: any) => {
      if (event.stateId === featureId) {
        setEvolutionCount(prev => prev + 1);
      }
    };
    
    const unsubscribe = evolutionManager.subscribeToEvolution(handleEvolution);
    return unsubscribe;
  }, [featureId]);
  
  return {
    evolutionCount,
    hasEvolved: evolutionCount > 0,
    triggerEvolution: () => {
      // Manual trigger for evolution (e.g., based on user feedback)
      evolutionManager.regenerateCode(featureId, {
        current: { manualTrigger: true },
        history: []
      });
    }
  };
}
