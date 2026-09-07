// jest-expo installs a lazy native `fetch`/logger bridge in its own setup
// file. In Node-based Jest workers that bridge can emit after teardown and
// turn an otherwise green suite into exit 1. Filter only that known warning
// before the Expo setup runs; all other warnings remain visible.
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (args.some((arg) => String(arg).includes("ExpoModulesCoreJSLogger"))) return;
  originalConsoleWarn(...args);
};
