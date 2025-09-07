/**
 * Central React hooks wrapper to prevent 'not defined' errors in production builds
 * This file creates a wrapper around React hooks to ensure they're always properly defined
 */
import React from 'react';

// Create wrapped versions of all React hooks that reference the React namespace directly
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

// Create a React hook component wrapper that injects the hooks properly
export function withReactHooks(Component: React.ComponentType<any>) {
  return function WrappedComponent(props: any) {
    return <Component {...props} useState={useStateSafe} useEffect={useEffectSafe} />;
  };
}

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
  useId: useIdSafe,
  withReactHooks
};
