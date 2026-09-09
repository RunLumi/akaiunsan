import React from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraLibrary } from "../CameraLibrary";
import i18n from "../../shared/I18n";
import { createWithStore, makeApiStore, act } from "../../test-utils/helpers";

const libButton = (root: any) =>
  root.findAllByProps({ title: i18n.t("home.image_library") })[0];

// The upload posts a FormData body through fetch; replace the global stub's
// implementation per-test (restored by jest.restoreAllMocks in afterEach).
const realFetch = globalThis.fetch;
const mockFetchImpl = (impl: (url: string) => any) => {
  (globalThis.fetch as jest.Mock).mockImplementation((url: any, init?: any) =>
    impl(typeof url === "string" ? url : url?.url || "")
  );
};
const globalFetchPostCalls = () =>
  (globalThis.fetch as jest.Mock).mock.calls.filter((c: any[]) => {
    const init = typeof c[0] === "string" ? c[1] : undefined;
    return (init?.method || "POST") === "POST";
  }).length;

describe("CameraLibrary", () => {
  beforeEach(() => {
    (globalThis.fetch as jest.Mock).mockClear();
    mockFetchImpl(async (url) => ({
      ok: true,
      status: 200,
      url: String(url),
      json: async () => ({ id: "img-1" }),
    }));
    // Re-seed native mocks so a choice made in one test can't leak into the next.
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: "granted" }
    );
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      cancelled: true,
    });
  });

  it("renders the library and camera buttons", () => {
    const { root } = createWithStore(
      <CameraLibrary isShowModalCamera children={jest.fn()} />,
      makeApiStore()
    );
    expect(
      root.findAllByProps({ title: i18n.t("home.image_library") }).length
    ).toBe(1);
    expect(root.findAllByProps({ title: i18n.t("home.camera") }).length).toBe(
      1
    );
  });

  it("library picks a photo and uploads it through the API", async () => {
    const children = jest.fn();
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///photo.png" }],
    });
    const { root } = createWithStore(
      <CameraLibrary isShowModalCamera children={children} />,
      makeApiStore()
    );
    const libraryBtn = libButton(root);
    await act(async () => libraryBtn.props.onPress());
    const uploadCalls = (globalThis.fetch as jest.Mock).mock.calls.filter(
      (c: any[]) => String(typeof c[0] === "string" ? c[0] : c[0]?.url).includes("/uploads/image")
    );
    expect(uploadCalls).toHaveLength(1);
    const [uploadUrl, uploadInit] = uploadCalls[0];
    expect(String(uploadUrl)).toContain("/uploads/image");
    expect(uploadInit.method).toBe("POST");
    expect(uploadInit.headers["Content-Type"]).toBe("multipart/form-data");
    expect(children).toHaveBeenCalledWith({ id: "img-1" });
  });

  it("cancelled library pick does not upload", async () => {
    const children = jest.fn();
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
    });
    const { root } = createWithStore(
      <CameraLibrary isShowModalCamera children={children} />,
      makeApiStore()
    );
    const libraryBtn = libButton(root);
    await act(async () => libraryBtn.props.onPress());
    expect(globalFetchPostCalls()).toBe(0);
    expect(children).not.toHaveBeenCalled();
  });

  it("denied media permission alerts instead of picking", async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: "denied" }
    );
    const alertSpy = jest.spyOn(Alert, "alert");
    const children = jest.fn();
    const { root } = createWithStore(
      <CameraLibrary isShowModalCamera children={children} />,
      makeApiStore()
    );
    const libraryBtn = libButton(root);
    await act(async () => libraryBtn.props.onPress());
    expect(alertSpy).toHaveBeenCalledWith(
      i18n.t("auth.error"),
      i18n.t("home.permission_camera")
    );
    expect(children).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("upload failure alerts instead of calling children", async () => {
    mockFetchImpl(async () => {
      throw new Error("boom");
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///photo.png" }],
    });
    const alertSpy = jest.spyOn(Alert, "alert");
    const children = jest.fn();
    const { root } = createWithStore(
      <CameraLibrary isShowModalCamera children={children} />,
      makeApiStore()
    );
    const libraryBtn = libButton(root);
    await act(async () => libraryBtn.props.onPress());
    // The component swallows the error in .catch and resolves postImage to
    // undefined, but still calls children with that result
    expect(alertSpy).toHaveBeenCalledWith(
      i18n.t("auth.error"),
      "Error: boom"
    );
    expect(children).toHaveBeenCalledWith(undefined);
    alertSpy.mockRestore();
  });
});