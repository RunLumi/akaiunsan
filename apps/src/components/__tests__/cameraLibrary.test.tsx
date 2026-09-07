import React from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { CameraLibrary } from "../CameraLibrary";
import i18n from "../../shared/I18n";
import { createWithStore, makeStore, act } from "../../test-utils/helpers";

const mockAxios = axios as unknown as jest.Mock;

const libButton = (root: any) =>
  root.findAllByProps({ title: i18n.t("home.image_library") })[0];

describe("CameraLibrary", () => {
  beforeEach(() => {
    mockAxios.mockReset();
    mockAxios.mockResolvedValue({ status: 200, data: { id: "img-1" } });
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
      makeStore()
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
      makeStore()
    );
    const libraryBtn = libButton(root);
    await act(async () => libraryBtn.props.onPress());
    expect(mockAxios).toHaveBeenCalledTimes(1);
    expect(mockAxios.mock.calls[0][0]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "multipart/form-data" },
    });
    expect(children).toHaveBeenCalledWith({ id: "img-1" });
  });

  it("cancelled library pick does not upload", async () => {
    const children = jest.fn();
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
    });
    const { root } = createWithStore(
      <CameraLibrary isShowModalCamera children={children} />,
      makeStore()
    );
    const libraryBtn = libButton(root);
    await act(async () => libraryBtn.props.onPress());
    expect(mockAxios).not.toHaveBeenCalled();
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
      makeStore()
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
    mockAxios.mockRejectedValue(new Error("boom"));
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///photo.png" }],
    });
    const alertSpy = jest.spyOn(Alert, "alert");
    const children = jest.fn();
    const { root } = createWithStore(
      <CameraLibrary isShowModalCamera children={children} />,
      makeStore()
    );
    const libraryBtn = libButton(root);
    await act(async () => libraryBtn.props.onPress());
    // The component swallows the error in .catch and resolves postImage to
    // undefined, but still calls children with that result
    expect(alertSpy).toHaveBeenCalledWith(
      i18n.t("auth.error"),
      expect.objectContaining({ message: "boom" })
    );
    expect(children).toHaveBeenCalledWith(undefined);
    alertSpy.mockRestore();
  });
});