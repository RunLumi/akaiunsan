import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Config from "react-native-config";
import Constants from "../shared/Constants";

// Phase 5 RTK Query strangler (docs/mobile-app-upgrade-plan.md §5): the typed
// API slice starts with the Auth endpoints — the module that gates
// navigation — and grows module-by-module while `useApi` call-sites port over.
// The base query mirrors useApi's transport contract: baseURL from
// react-native-config, Bearer token, Accept-Language and platform headers.
export interface LoginResponse {
  auth_token: string;
  user?: Record<string, any>;
}

export interface SignupPayload {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  referralCode?: string;
  address?: string;
  avatar?: string;
  identityNumber?: string;
  gender?: any;
}

export interface SignupResponse {
  message?: string;
  user?: Record<string, any>;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: Config.API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any)?.auth?.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Accept-Language", "en");
      headers.set("platform", "app");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>(
      {
        query: (credentials) => ({
          url: Constants.API.login,
          method: "post",
          body: credentials,
        }),
      }
    ),
    signup: builder.mutation<SignupResponse, SignupPayload>({
      query: (payload) => ({
        url: Constants.API.register,
        method: "post",
        body: payload,
      }),
    }),
  }),
});

export const { useLoginMutation, useSignupMutation } = apiSlice;
