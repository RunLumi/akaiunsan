import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import reducers from "./reducers";
import { apiSlice } from "./apiSlice";

// Phase 5 RTK Query strangler: the API slice mounts ALONGSIDE the legacy
// reducers inside the same store shape the app already consumes. useApi
// call-sites port module-by-module onto `apiSlice`; legacy slices stay in
// control until their ports land (docs/mobile-app-upgrade-plan.md §5).
export const setupListenerMiddleware = (preloadedState?: any) =>
  configureStore({
    // The legacy reducers and the RTK api slice coexist during the strangler
    // migration; their redux typings come from separate copies, so the
    // combined reducer is cast to keep TS quiet (RTK is typed internally).
    reducer: {
      ...reducers,
      [apiSlice.reducerPath]: apiSlice.reducer,
    } as any,
    middleware: (getDefaultMiddleware: any) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(apiSlice.middleware),
    preloadedState,
    enhancers: (getDefaultEnhancers: any) => getDefaultEnhancers(),
  });

export const setupListenersCompat = setupListeners;
