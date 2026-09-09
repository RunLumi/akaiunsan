import { isNil } from "lodash";
import dayjs from ".//dayjs";
import { Platform } from "react-native";
import Enum from "./Enum";
import i18n from "./I18n";

export const getRegionForCoordinates = (points: any[]) => {
  let minX: number;
  let maxX: number;
  let minY: number;
  let maxY: number;

  ((point) => {
    minX = point.latitude;
    maxX = point.latitude;
    minY = point.longitude;
    maxY = point.longitude;
  })(points[0]);

  points.map((point: any) => {
    minX = Math.min(minX, point.latitude);
    maxX = Math.max(maxX, point.latitude);
    minY = Math.min(minY, point.longitude);
    maxY = Math.max(maxY, point.longitude);
  });

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const deltaX = maxX - minX;
  const deltaY = maxY - minY;

  return {
    latitude: midX,
    longitude: midY,
    latitudeDelta: deltaX,
    longitudeDelta: deltaY,
  };
};

export const removeVietnameseTones = (val: string) =>
  val
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

export const paramArray = (params: any) => {
  try {
    if (params && params.length) {
      let param = new URLSearchParams();
      for (let index = 0; index < params.length; index++) {
        param.append(`${Object.keys(params[index])}`, `${Object.values(params[index])[0]}`)
      }
      return param;
    }
  } catch (error) {
    console.log('error ', error)
  }

}

export const getStatus = (orderStatus: any, order?: any) => {
  let status;
  switch (orderStatus) {
    case 0:
      status = i18n.t("Pending");
      break;
    case 1:
      status = i18n.t("Match");
      break;
    case 2:
      status = `${i18n.t("Completed")} ${!isNil(order) ? ('- ' + dayjs(order.bookingDetail.bookingHour).format('H:mm A')) : ''}`;
      break;
    case 3:
      status = i18n.t("Cancel");
      break;
    case 4:
      status = `${i18n.t("On_Process")} ${!isNil(order) ? ('- ' + dayjs(order.bookingDetail.bookingDate).format('H:mm A')) : ''}`;
      break;
    case 5:
      status = i18n.t("Waiting confirm");
      break;
    default:
      status = i18n.t("confirmed");
      break;
  }

  return status;
};

export const getSpecialRequest = (status: any) => {
  switch (status) {
    case 1:
      return "Approved";
    case 2:
      return "Reject";
    case 3:
      return "Create";
    default:
      return "";
  }
};

export const rankBackground = (rank: number) => {
  switch (rank) {
    case 2:
      return require("../assets/images/card_gold.png");
    case 3:
      return require("../assets/images/card_black.png");
    default:
      return require("../assets/images/card_silver.png");
  }
};

export const currentPlatform = () => {
  if (Platform.OS === "android") {
    return Enum.PlatformType.ANDROID
  } else if (Platform.OS === "ios") {
    return Enum.PlatformType.IOS
  } else if (Platform.OS === "web") {
    return Enum.PlatformType.WEBSITE
  }
};
