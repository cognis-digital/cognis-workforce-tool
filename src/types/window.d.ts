/**
 * Global window interface extensions
 */

interface Window {
  ENV?: {
    VITE_APP_NAME?: string;
    VITE_API_URL?: string;
    VITE_APP_BUILD_TIME?: string;
    VITE_APP_COMMIT_HASH?: string;
    VITE_PUBLIC_URL?: string;
    VITE_COGNIS_API_KEY?: string;
    VITE_SELF_HOSTED?: string;
    [key: string]: string | undefined;
  };
  
  // Host validation properties
  READ_HOST_VALIDATION_DISABLED?: boolean;
  __INSIGHTS_WHITELIST?: {
    includes: (host: string) => boolean;
  };
  __CONTENT_VALIDATION_DISABLED?: boolean;
  __SECURITY_WARNINGS_DISABLED?: boolean;
  __HOST_IS_VALIDATED?: boolean;
  __DOMAIN_VALID?: boolean;
  __BYPASS_HOST_CHECK?: boolean;
  
  // React hooks for global access
  useState?: any;
  useEffect?: any;
  useContext?: any;
  useReducer?: any;
  useCallback?: any;
  useMemo?: any;
  useRef?: any;
  
  // Read object for host validation
  read?: {
    validateHost: () => boolean;
    isValidDomain: () => boolean;
    verifyOrigin: () => boolean;
  };
}
