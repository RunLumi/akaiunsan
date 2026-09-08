import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";
import { useSelector } from "react-redux";
import { currentPlatform } from "../shared/Utils";
import DeviceInfo from "react-native-device-info";

import Config from "react-native-config";
import i18n from "../shared/I18n";
import Constants from "../shared/Constants";

const APP_KEY = Config.APP_KEY || Config.EXPO_PUBLIC_APP_KEY || process.env.EXPO_PUBLIC_APP_KEY || "";

const useApi = ({
  method = "get",
  url,
  headers,
  params,
  data,
  ...props
}: {
  method?: "post" | "put" | "get" | "patch" | "delete";
  url: string;
  data?: any;
  params?: any;
  headers?: any;
  autoRequest?: boolean;
  callback?: ({ error, response }: { error: string; response: any }) => any;
}) => {
  const [loading, setLoading] = useState<boolean>(
    props.autoRequest ? true : false
  );
  const [error, setError] = useState<any>();
  const [response, setResponse] = useState<any>();
  const token = useSelector((state: any) => state.auth.token);
  const { language } = useSelector((state: any) => state.language);
  const config: AxiosRequestConfig = {
    method,
    url,
    // headers,
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
      "Accept-Language": language,
      platform: currentPlatform(),
      ...(APP_KEY ? { "x-app-key": APP_KEY } : {}),
    },
    params,
    data,
    // baseURL: Constants.API.base,
    baseURL: Config.API_URL,
  };

  useEffect(() => {
    if (props.autoRequest) {
      InteractionManager.runAfterInteractions(() => {
        request();
      });
    }
  }, []);

  // Params will use as custom
  const request = async (custom?: {
    url?: string;
    data?: any;
    params?: any;
    headers?: any;
  }) => {
    setLoading(true);
    setError("");
    let localError = "",
      localResponse = null;
    console.log("back", url);
    try {
      const responseData: AxiosResponse = await axios({
        ...config,
        ...(custom || {}),
      });
      // Handle response
      console.log("responseData ", responseData);
      if (responseData.status >= 200 && responseData.status < 300) {
        if (
          Array.isArray(responseData.data?.errors) &&
          responseData.data?.errors.length > 0
        ) {
          localResponse = responseData.data;
          localError = responseData.data?.errors[0]?.message;
        } else {
          // Akaiunsan's Express API returns direct JSON bodies; retain support
          // for the retired wrapped `{ data: ... }` response shape while the
          // remaining mobile screens are migrated.
          localResponse = responseData.data?.data ?? responseData.data;
        }
      } else {
        localError = responseData.statusText;
      }
      setError(localError);
      setResponse(localResponse);
      if (props.callback) {
        props.callback({
          error: localError,
          response: localResponse,
        });
      }
      setLoading(false);
    } catch (error: any) {
			setLoading(false);
        setError(error.message);
        if (props.callback) {
          props.callback({
            error:
              error.message === "Request failed with status code 400"
                ? i18n.t("home.error_400")
                : error.message,
            response: {},
          });
      }
    }
  };

  return [loading, request, error, response];
};

export default useApi;
