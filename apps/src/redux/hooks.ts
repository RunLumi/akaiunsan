// Typed Redux hooks — Phase 3 deliverable. Components can migrate from
// `useSelector((state: ApiItem) => …)` to `useAppSelector((state) => …)` with the
// selector's `state` parameter now typed as RootState (no `any`).
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState } from "./reducers";
import type { ApiItem } from "../redux/apiSlice";

export const useAppDispatch: () => ReturnType<typeof useDispatch> = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
