import {
  LocationGeocodedAddress,
  LocationGeocodedLocation,
} from "expo-location";
import _ from "lodash";

const GOOGLE_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";
let googleApiKey: string | undefined;

type GoogleApiGeocodingAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleApiGeocodingResult = {
  address_components: GoogleApiGeocodingAddressComponent[];
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
};

type GoogleApiGeocodingResponse = {
  results: GoogleApiGeocodingResult[];
  status: string;
};

export function setGoogleApiKey(apiKey: string) {
  googleApiKey = apiKey;
}

export async function googleGeocodeAsync(
  address: string
): Promise<LocationGeocodedLocation[]> {
  const result = await requestGoogleApiAsync({ address });

  if (result.status === "ZERO_RESULTS") {
    return [];
  }

  return result.results.map(geocodingResultToLocation);
}

async function requestAddressGoogleApiAsync(
 add: string
): Promise<GoogleApiGeocodingResponse> {
  const result = await fetch(
    `${GOOGLE_API_URL}?address=${add}&key=${googleApiKey}&language=vi`
  );
  return await result.json();
}
export async function googleAddressGeocodeAsync(address: string): Promise<LocationGeocodedAddress[]> {
  const result = await requestAddressGoogleApiAsync(address);
  const results = result.results
  .map(reverseGeocodingResultToAddress)
  .filter((x) => x.country);
  return _.sortBy(results, ["region", "country"]);
}


export async function googleReverseGeocodeAsync(options: {
  latitude: number;
  longitude: number;
}): Promise<LocationGeocodedAddress[]> {
  const result = await requestGoogleApiAsync({
    latlng: `${options.latitude},${options.longitude}`,
  });
  if (result.status === "ZERO_RESULTS") {
    return [];
  }

  const results = result.results
    .map(reverseGeocodingResultToAddress)
    .filter((x) => x.country);

  return _.sortBy(results, ["region", "country"]);
}

async function requestGoogleApiAsync(
  params: { address: string } | { latlng: string }
): Promise<GoogleApiGeocodingResponse> {
  const query = Object.entries(params)
    .map((entry) => `${entry[0]}=${encodeURI(entry[1])}`)
    .join("&");
  const result = await fetch(
    `${GOOGLE_API_URL}?key=${googleApiKey}&${query}&language=vi`
  );
  return await result.json();
}

function geocodingResultToLocation(
  result: GoogleApiGeocodingResult
): LocationGeocodedLocation {
  const { location } = result.geometry;
  return {
    latitude: location.lat,
    longitude: location.lng,
  };
}

function reverseGeocodingResultToAddress(
  result: GoogleApiGeocodingResult
): LocationGeocodedAddress {
  const address: Record<string, unknown> = {};

  for (const { long_name, short_name, types } of result.address_components) {
    if (types.includes("locality")) {
      address.city = long_name;
      continue;
    }
    if (types.includes("sublocality")) {
      address.district = long_name;
      continue;
    }
    if (types.includes("street_address") || types.includes("route")) {
      address.street = long_name;
      continue;
    }
    if (types.includes("administrative_area_level_1")) {
      address.region = long_name;
      continue;
    }
    if (types.includes("administrative_area_level_2")) {
      address.subregion = long_name;
      continue;
    }
    if (types.includes("country")) {
      address.country = long_name;
      address.isoCountryCode = short_name;
      continue;
    }
    if (types.includes("postal_code")) {
      address.postalCode = long_name;
      continue;
    }
    if (types.includes("point_of_interest")) {
      address.name = long_name;
      continue;
    }

  }
  if (!address.name) {
    address.name = result.formatted_address.replace(/,.*$/, "");
  }
  address.location = result?.geometry?.location
  return address as LocationGeocodedAddress;
}

export async function getAddress(lat: number, long: number) {
   const result = await fetch(
    `${GOOGLE_API_URL}?latlng=${lat},${long}&key=${googleApiKey}&sensor=true&language=vi`
  );
  return await result.json();
}