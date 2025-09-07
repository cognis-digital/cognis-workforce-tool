/**
 * React hooks wrapper to prevent "useState is not defined" errors in production builds
 * This file provides safe alternatives to React hooks that always reference React properly
 */
import React from 'react';

// Export safe versions of React hooks that properly reference the React namespace
export const useStateSafe = React.useState;
export const useEffectSafe = React.useEffect;
export const useContextSafe = React.useContext;
export const useReducerSafe = React.useReducer;
export const useCallbackSafe = React.useCallback;
export const useMemoSafe = React.useMemo;
export const useRefSafe = React.useRef;
export const useImperativeHandleSafe = React.useImperativeHandle;
export const useLayoutEffectSafe = React.useLayoutEffect;
export const useDebugValueSafe = React.useDebugValue;

// React 18 hooks
export const useTransitionSafe = React.useTransition;
export const useDeferredValueSafe = React.useDeferredValue;
export const useIdSafe = React.useId;

// Default export for convenience
export default {
  useState: useStateSafe,
  useEffect: useEffectSafe,
  useContext: useContextSafe,
  useReducer: useReducerSafe,
  useCallback: useCallbackSafe,
  useMemo: useMemoSafe,
  useRef: useRefSafe,
  useImperativeHandle: useImperativeHandleSafe,
  useLayoutEffect: useLayoutEffectSafe,
  useDebugValue: useDebugValueSafe,
  useTransition: useTransitionSafe,
  useDeferredValue: useDeferredValueSafe,
  useId: useIdSafe
};
