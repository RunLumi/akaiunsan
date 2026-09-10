import rootReducer, { RootState } from "../reducers";
import auth from "../reducers/auth";
import tools from "../reducers/tools";
import language from "../reducers/language";
import { success, TYPES } from "../actions";

const unknownAction = { type: "UNKNOWN", payload: null };

describe("auth reducer characterization", () => {
  it("starts with empty token, no user, not loading", () => {
    expect(auth(undefined, unknownAction)).toEqual({
      token: "",
      user: null,
      loading: false,
    });
  });

  it("LOGIN success stores the token only", () => {
    const state = auth(undefined, {
      type: success(TYPES.AUTH.LOGIN),
      payload: { token: "abc" },
    });
    expect(state).toEqual({ token: "abc", user: null, loading: false });
  });

  it("PROFILE success stores the user only", () => {
    const state = auth(
      { token: "abc", user: null, loading: false },
      { type: success(TYPES.AUTH.PROFILE), payload: { user: { id: 7 } } }
    );
    expect(state).toEqual({ token: "abc", user: { id: 7 }, loading: false });
  });

  it("LOG_OUT success resets to the initial state", () => {
    const state = auth(
      { token: "abc", user: { id: 7 }, loading: false },
      { type: success(TYPES.AUTH.LOG_OUT), payload: null }
    );
    expect(state).toEqual({ token: "", user: null, loading: false });
  });

  it("unknown actions return the same reference", () => {
    const state = { token: "abc", user: null, loading: false };
    expect(auth(state, unknownAction)).toBe(state);
  });
});

describe("tools reducer characterization", () => {
  it("starts hidden with zero badge", () => {
    expect(tools(undefined, unknownAction)).toEqual({
      picker: { isShow: false, data: [], selected: "", callback: expect.any(Function) },
      notification: 0,
    });
  });

  it("OPEN_PICKER merges payload and forces isShow true", () => {
    const state = tools(undefined, {
      type: TYPES.TOOLS.OPEN_PICKER,
      payload: { data: ["a", "b"], selected: "a", callback: jest.fn() },
    });
    expect(state.picker.isShow).toBe(true);
    expect(state.picker.data).toEqual(["a", "b"]);
    expect(state.picker.selected).toBe("a");
    expect(state.notification).toBe(0);
  });

  it("CLOSE_PICKER resets the picker to initial", () => {
    const open = tools(undefined, {
      type: TYPES.TOOLS.OPEN_PICKER,
      payload: { data: ["a"] },
    });
    const state = tools(open, { type: TYPES.TOOLS.CLOSE_PICKER, payload: null });
    expect(state.picker).toEqual({
      isShow: false,
      data: [],
      selected: "",
      callback: expect.any(Function),
    });
  });

  it("NOTIFICATION sets the badge count", () => {
    expect(
      tools(undefined, { type: TYPES.TOOLS.NOTIFICATION, payload: 12 }).notification
    ).toBe(12);
  });

  it("unknown actions return the same reference", () => {
    const state = tools(undefined, unknownAction);
    expect(tools(state, unknownAction)).toBe(state);
  });
});

describe("language reducer characterization", () => {
  it("defaults to vietnamese", () => {
    expect(language(undefined, unknownAction)).toEqual({ language: "vi" });
  });

  it("Update/Language success switches the language", () => {
    expect(
      language(undefined, {
        type: success(TYPES.LANGUAGE),
        payload: { language: "en" },
      })
    ).toEqual({ language: "en" });
  });
});

describe("root reducer characterization", () => {
  it("combines auth, tools, language", () => {
    const state: RootState = rootReducer(undefined, unknownAction);
    expect(Object.keys(state).sort()).toEqual(["auth", "language", "tools"]);
  });

  it("a LOGIN success flows through the combined reducer (auth-gate contract)", () => {
    const state = rootReducer(undefined, {
      type: success(TYPES.AUTH.LOGIN),
      payload: { token: "t1" },
    });
    expect(state.auth.token).toBe("t1");
  });
});
