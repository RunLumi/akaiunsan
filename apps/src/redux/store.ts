import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";
import logger from "redux-logger";
import { apiSlice } from "./apiSlice";
import { rootReducers } from "./listenerMiddleware";
import { logoutMiddleware } from "./logoutMiddleware";

// Phase 5: the store is an RTK `configureStore` over the same persisted root
// (whitelist auth+language, blacklist tools) the legacy createStore composed,
// plus the apiSlice middleware, the logout middleware (replacing the deleted
// redux-saga watcher) and redux-logger — dev-only now, it ran unconditionally
// before (docs/mobile-app-upgrade-plan.md §5).

// Version 1: Thai was replaced by Vietnamese as the app language, so a
// persisted locale of "th" remaps to "vi" (English stays "en").
export const migrateLanguageToVi = (state: any, version: number) =>
  Promise.resolve(
    version < 1 && state?.language?.language === "th"
      ? { ...state, language: { ...state.language, language: "vi" } }
      : state
  );

const persistConfig = {
  key: "root",
  version: 1,
  keyPrefix: "",
  storage: AsyncStorage,
  blacklist: ["tools"],
  whitelist: ["auth", "language"],
  migrate: migrateLanguageToVi,
};

// Exported so store.test.ts can pin both branches of the logger gate.
export const buildMiddleware =
  (dev: boolean) => (getDefaultMiddleware: any) =>
    getDefaultMiddleware({
      // persist actions carry non-serializable AsyncStorage handles
      serializableCheck: false,
      immutableCheck: false,
    })
      .concat(apiSlice.middleware, logoutMiddleware)
      .concat(dev ? [logger] : []);

const persistedReducer = persistReducer(persistConfig, rootReducers);

export const store = configureStore({
  reducer: persistedReducer as any,
  middleware: buildMiddleware(__DEV__),
  enhancers: (getDefaultEnhancers: any) => getDefaultEnhancers(),
});

export const persistor = persistStore(store);

// Same exported shape the app entry has always consumed
// (`redux.store` / `redux.persistor` in App.tsx).
export default { store, persistor };
