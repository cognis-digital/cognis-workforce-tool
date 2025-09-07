import React, { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  rbacLoggingService, 
  InteractionType, 
  InteractionLog 
} from '../services/rbacLogging';
import { useAuthStore } from '../store/authStore';

/**
 * Hook to track page views
 */
export const usePageViewTracking = () => {
  const location = useLocation();
  const { user, userProfile } = useAuthStore();
  
  useEffect(() => {
    // Set current page in the logging service
    rbacLoggingService.setCurrentPage(location.pathname);
    
    // Update user info if available
    if (user && userProfile) {
      rbacLoggingService.updateUserInfo();
    }
  }, [location.pathname, user, userProfile]);
};

/**
 * Hook to track component interactions
 */
export const useComponentTracking = (
  componentName: string,
  page?: string
) => {
  // Track component mount/unmount
  useEffect(() => {
    // Component mounted
    rbacLoggingService.log({
      interaction_type: InteractionType.PAGE_VIEW,
      component: componentName,
      page: page || '',
      action: 'mount'
    });

    return () => {
      // Component unmounted
      rbacLoggingService.log({
        interaction_type: InteractionType.PAGE_VIEW,
        component: componentName,
        page: page || '',
        action: 'unmount'
      });
    };
  }, [componentName, page]);

  // Return tracking functions
  return {
    trackInteraction: useCallback((interactionType: InteractionType, action: string, target?: string, details?: any) => {
      rbacLoggingService.log({
        interaction_type: interactionType,
        component: componentName,
        page: page || '',
        action,
        target,
        details
      });
    }, [componentName, page]),

    trackClick: useCallback((
      target: string, 
      details?: any
    ) => {
      rbacLoggingService.logButtonClick(componentName, target, details);
    }, [componentName]),

    trackFormSubmit: useCallback((
      formName: string, 
      formData: any
    ) => {
      rbacLoggingService.logFormSubmit(formName, formData);
    }, []),

    trackModalOpen: useCallback((
      modalName: string, 
      details?: any
    ) => {
      rbacLoggingService.logModalInteraction(modalName, 'open', details);
    }, []),

    trackModalClose: useCallback((
      modalName: string, 
      details?: any
    ) => {
      rbacLoggingService.logModalInteraction(modalName, 'close', details);
    }, []),

    trackError: useCallback((
      error: Error, 
      context?: any
    ) => {
      rbacLoggingService.logError(componentName, error, context);
    }, [componentName]),

    trackApiRequest: useCallback((
      endpoint: string,
      method: string,
      requestData?: any
    ) => {
      rbacLoggingService.logApiRequest(endpoint, method, requestData);
    }, []),

    trackApiResponse: useCallback((
      endpoint: string,
      method: string,
      status: number,
      responseData?: any
    ) => {
      rbacLoggingService.logApiResponse(endpoint, method, status, responseData);
    }, []),

    trackCustomInteraction: useCallback((
      interactionType: InteractionType,
      action: string,
      target?: string,
      details?: any
    ) => {
      rbacLoggingService.log({
        interaction_type: interactionType,
        component: componentName,
        page: page || '',
        action,
        target,
        details
      });
    }, [componentName, page])
  };
};

/**
 * Hook to measure and track time spent on a page or component
 */
export const useTimeTracking = (
  componentName: string,
  page?: string
) => {
  const startTime = useRef(Date.now());
  
  useEffect(() => {
    // Reset start time on mount
    startTime.current = Date.now();

    return () => {
      // Log time spent on unmount
      const timeSpentMs = Date.now() - startTime.current;
      rbacLoggingService.log({
        interaction_type: InteractionType.PAGE_VIEW,
        component: componentName,
        page: page || '',
        action: 'time_spent',
        details: {
          time_ms: timeSpentMs,
          time_readable: `${(timeSpentMs / 1000).toFixed(2)} seconds`
        }
      });
    };
  }, [componentName, page]);
  
  // Return function to manually track time spent
  return {
    trackTimeSpent: useCallback(() => {
      const timeSpentMs = Date.now() - startTime.current;
      rbacLoggingService.log({
        interaction_type: InteractionType.PAGE_VIEW,
        component: componentName,
        page: page || '',
        action: 'time_spent',
        details: {
          time_ms: timeSpentMs,
          time_readable: `${(timeSpentMs / 1000).toFixed(2)} seconds`
        }
      });
      
      // Reset start time
      startTime.current = Date.now();
      
      return timeSpentMs;
    }, [componentName, page])
  };
};

/**
 * Hook to track API interactions
 */
export const useApiTracking = () => {
  return {
    trackApiRequest: useCallback((
      endpoint: string,
      method: string,
      requestData?: any
    ) => {
      rbacLoggingService.logApiRequest(endpoint, method, requestData);
    }, []),

    trackApiResponse: useCallback((
      endpoint: string,
      method: string,
      status: number,
      responseData?: any
    ) => {
      rbacLoggingService.logApiResponse(endpoint, method, status, responseData);
    }, []),

    // Create a wrapper for fetch that automatically tracks API calls
    trackedFetch: useCallback(async (
      url: string,
      options: RequestInit = {}
    ) => {
      const method = options.method || 'GET';
      const requestData = options.body;

      // Log the request
      rbacLoggingService.logApiRequest(url, method, requestData);
      
      try {
        // Make the actual request
        const response = await fetch(url, options);
        
        // Clone the response so we can read it twice
        const clone = response.clone();
        
        // Try to parse response as JSON
        let responseData;
        try {
          responseData = await clone.json();
        } catch (e) {
          // If not JSON, get text
          try {
            responseData = await clone.text();
          } catch (e) {
            responseData = 'Could not read response body';
          }
        }
        
        // Log the response
        rbacLoggingService.logApiResponse(
          url, 
          method, 
          response.status,
          responseData
        );
        
        return response;
      } catch (error) {
        // Log the error
        rbacLoggingService.logError('API', error as Error, { url, method });
        throw error;
      }
    }, [])
  };
};

/**
 * Higher-order component to track component rendering and lifecycle
 */
export function withTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  const WithTrackingComponent: React.FC<P> = (props) => {
    // Use the component tracking hook
    useComponentTracking(componentName);
    
    // Render the wrapped component with its props
    return <Component {...props} />;
  };
  
  // Set display name for easier debugging
  WithTrackingComponent.displayName = `WithTracking(${componentName})`;
  
  return WithTrackingComponent;
}

/**
 * A utility to track and analyze feature usage by role
 */
export const useFeatureUsageAnalytics = () => {
  const { userProfile } = useAuthStore();
  const role = userProfile?.role || 'anonymous';
  
  return {
    // Track feature usage
    trackFeatureUsage: useCallback((
      featureName: string, 
      details?: any
    ) => {
      rbacLoggingService.log({
        interaction_type: InteractionType.BUTTON_CLICK,
        component: 'Feature',
        page: '',
        action: 'use',
        target: featureName,
        details: {
          ...details,
          user_role: role
        }
      });
    }, [role]),
    
    // Get feature usage statistics by role
    getFeatureUsageByRole: async (
      featureName: string
    ) => {
      const logs = await rbacLoggingService.getRoleLogs(role);
      return logs.filter(log => 
        log.target === featureName && 
        log.action === 'use' && 
        log.interaction_type === InteractionType.BUTTON_CLICK
      );
    }
  };
};

/**
 * Primary hook that combines all tracking functionality
 */
export const useTracking = (
  componentName: string,
  page?: string
) => {
  // Use all tracking hooks
  const componentTracking = useComponentTracking(componentName, page);
  const timeTracking = useTimeTracking(componentName, page);
  const apiTracking = useApiTracking();
  const featureAnalytics = useFeatureUsageAnalytics();
  
  // Return a combined object with all tracking functions
  return {
    ...componentTracking,
    ...timeTracking,
    ...apiTracking,
    ...featureAnalytics,
    
    // Add a convenience method to log any interaction
    trackInteraction: (
      interactionType: InteractionType,
      action: string,
      target?: string,
      details?: any
    ) => {
      rbacLoggingService.log({
        interaction_type: interactionType,
        component: componentName,
        page: page || '',
        action,
        target,
        details
      });
    }
  };
};
