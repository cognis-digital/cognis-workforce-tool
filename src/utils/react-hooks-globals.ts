// Safe global exposure of React hooks for runtime fallback (no patching of React.createElement)
import React from 'react';

(function installReactHookGlobals() {
  if (typeof window === 'undefined') return;
  const w = window as any;
  const r = React as any;
  const names = [
    'useState','useEffect','useContext','useReducer','useCallback','useMemo','useRef',
    'useImperativeHandle','useLayoutEffect','useDebugValue','useTransition','useDeferredValue','useId'
  ];
  for (const n of names) {
    if (!w[n] && r[n]) w[n] = r[n];
  }
})();
