interface Window {
  ENV?: {
    VITE_APP_NAME: string;
    VITE_API_URL: string;
    VITE_APP_BUILD_TIME: string;
    VITE_APP_COMMIT_HASH: string;
    VITE_PUBLIC_URL: string;
    VITE_COGNIS_API_KEY: string;
    [key: string]: any;
  };
}
