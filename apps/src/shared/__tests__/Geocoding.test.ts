jest.mock("expo-location", () => ({}));

import {
  setGoogleApiKey,
  googleGeocodeAsync,
  googleReverseGeocodeAsync,
  googleAddressGeocodeAsync,
  getAddress,
} from "../Geocoding";

const mockFetch = (body: unknown) =>
  (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
    json: () => Promise.resolve(body),
  });

const component = (long_name: string, types: string[], short_name = long_name) => ({
  long_name,
  short_name,
  types,
});

const sampleResult = {
  formatted_address: "Siam Square, Pathum Wan, Bangkok 10330, Thailand",
  address_components: [
    component("Siam Square", ["point_of_interest"]),
    component("Pathum Wan", ["sublocality"]),
    component("Bangkok", ["locality", "administrative_area_level_2"]),
    component("Bangkok", ["administrative_area_level_1"]),
    component("TH", ["country"], "TH"),
    component("10330", ["postal_code"]),
  ],
  geometry: { location: { lat: 13.7469, lng: 100.5349 } },
};

beforeEach(() => {
  jest.restoreAllMocks();
  setGoogleApiKey("test-key");
});

describe("googleGeocodeAsync characterization", () => {
  it("maps geometry locations", async () => {
    mockFetch({
      status: "OK",
      results: [
        sampleResult,
        { ...sampleResult, geometry: { location: { lat: 1, lng: 2 } } },
      ],
    });
    const locations = await googleGeocodeAsync("siam");
    expect(locations).toEqual([
      { latitude: 13.7469, longitude: 100.5349 },
      { latitude: 1, longitude: 2 },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://maps.googleapis.com/maps/api/geocode/json?key=test-key&address=siam&language=th"
    );
  });

  it("ZERO_RESULTS yields an empty list", async () => {
    mockFetch({ status: "ZERO_RESULTS", results: [] });
    expect(await googleGeocodeAsync("nowhere")).toEqual([]);
  });
});

describe("googleReverseGeocodeAsync characterization", () => {
  it("builds a typed address from components and sorts by region/country", async () => {
    mockFetch({ status: "OK", results: [sampleResult] });
    const addresses = await googleReverseGeocodeAsync({
      latitude: 13.7469,
      longitude: 100.5349,
    });
    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toEqual({
      name: "Siam Square",
      street: undefined,
      district: "Pathum Wan",
      city: "Bangkok",
      region: "Bangkok",
      country: "TH",
      isoCountryCode: "TH",
      postalCode: "10330",
      location: { lat: 13.7469, lng: 100.5349 },
    });
    // `subregion` stays undefined: the Bangkok component's `locality` type
    // matches first (with `continue`), so inline `administrative_area_level_2`
    // never sets it. Pins current behavior.
    expect(global.fetch).toHaveBeenCalledWith(
      "https://maps.googleapis.com/maps/api/geocode/json?key=test-key&latlng=13.7469,100.5349&language=th"
    );
  });

  it("drops results without a country", async () => {
    mockFetch({
      status: "OK",
      results: [
        {
          ...sampleResult,
          address_components: [component("Nowhere", ["locality"])],
        },
      ],
    });
    expect(await googleReverseGeocodeAsync({ latitude: 0, longitude: 0 })).toEqual([]);
  });

  it("falls back to formatted_address (first segment) when no point_of_interest", async () => {
    mockFetch({
      status: "OK",
      results: [
        {
          ...sampleResult,
          address_components: sampleResult.address_components.filter(
            (c) => !c.types.includes("point_of_interest")
          ),
        },
      ],
    });
    const [address] = await googleReverseGeocodeAsync({ latitude: 1, longitude: 1 });
    expect(address.name).toBe("Siam Square");
    expect(address.city).toBe("Bangkok");
  });

  it("street_address/route components map to street", async () => {
    mockFetch({
      status: "OK",
      results: [
        {
          ...sampleResult,
          address_components: [
            component("Rama I Road", ["route"]),
            component("TH", ["country"], "TH"),
          ],
        },
      ],
    });
    const [address] = await googleReverseGeocodeAsync({ latitude: 1, longitude: 1 });
    expect(address.street).toBe("Rama I Road");
  });

  it("ZERO_RESULTS yields an empty list", async () => {
    mockFetch({ status: "ZERO_RESULTS", results: [] });
    expect(await googleReverseGeocodeAsync({ latitude: 9, longitude: 9 })).toEqual([]);
  });
});

describe("googleAddressGeocodeAsync characterization", () => {
  it("queries with language=th and maps addresses", async () => {
    mockFetch({ status: "OK", results: [sampleResult] });
    const addresses = await googleAddressGeocodeAsync("siam square");
    expect(addresses).toHaveLength(1);
    expect(addresses[0].country).toBe("TH");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://maps.googleapis.com/maps/api/geocode/json?address=siam square&key=test-key&language=th"
    );
  });
});

describe("getAddress characterization", () => {
  it("returns the raw geocoding payload with sensor=true", async () => {
    mockFetch({ status: "OK", results: [sampleResult] });
    const raw = await getAddress(13.7, 100.5);
    expect(raw.status).toBe("OK");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://maps.googleapis.com/maps/api/geocode/json?latlng=13.7,100.5&key=test-key&sensor=true&language=th"
    );
  });
});
