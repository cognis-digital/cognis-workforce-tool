/**
 * React Hooks Export Module
 * 
 * This module ensures that all React hooks are properly exported and available throughout the application.
 * Using this centralized approach prevents "useState is not defined" errors in bundled code.
 */

import React from 'react';

// Re-export React hooks using namespace to ensure they're always available
export const useState = React.useState;
export const useEffect = React.useEffect;
export const useContext = React.useContext;
export const useReducer = React.useReducer;
export const useCallback = React.useCallback;
export const useMemo = React.useMemo;
export const useRef = React.useRef;
export const useImperativeHandle = React.useImperativeHandle;
export const useLayoutEffect = React.useLayoutEffect;
export const useDebugValue = React.useDebugValue;

// Export additional React hooks if using React 17+
export const useDeferredValue = React.useDeferredValue;
export const useTransition = React.useTransition;
export const useId = React.useId;

// Export this module as the default export as well
export default {
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  useLayoutEffect,
  useDebugValue,
  useDeferredValue,
  useTransition,
  useId
};
