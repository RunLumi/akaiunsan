const {
  withAndroidManifest,
  withAppBuildGradle,
  withGradleProperties,
} = require("@expo/config-plugins");

// React Native 0.86 requires JDK 17-20; JDK 24 triggers "restricted method in
// java.lang.System" from the CMake toolchain and Gradle 9 warns at config
// because RN runs node -e at configuration time. Pin the LTS JDK and disable
// the configuration cache so a bare `gradlew assembleDebug` works on a fresh
// prebuild checkout.

const GRADLE_EXTRAS = [
  { type: "property", key: "org.gradle.configuration-cache", value: "false" },
];

const DOTENV_MARKER = "// @akaiunsan-react-native-config";
const DOTENV_APPLY = `
${DOTENV_MARKER}
apply from: new File(rootDir, "../node_modules/react-native-config/android/dotenv.gradle")
def akaiunsanEnvironment = project.ext.has("env") ? project.ext.env["EXPO_PUBLIC_SENTRY_ENV"] : null
def akaiunsanAllowCleartextTraffic = ["local", "development", "maestro"].contains(akaiunsanEnvironment)
android.defaultConfig.manifestPlaceholders["akaiunsanAllowCleartextTraffic"] = akaiunsanAllowCleartextTraffic.toString()
`;

function findJdkHome() {
  const { execSync } = require("child_process");
  try {
    const home = execSync(
      `/usr/libexec/java_home -v 21 2>/dev/null || /usr/libexec/java_home -v 17 2>/dev/null || true`,
      { encoding: "utf8" }
    ).trim();
    if (home) return home;
  } catch (_) {
    // fall through to manual paths
  }
  const candidates = [
    process.env.JAVA_HOME,
    "/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home",
    "/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home",
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home",
  ].filter(Boolean);
  return candidates.find((c) => require("fs").existsSync(c)) || "";
}

module.exports = function withAndroidGradleProps(config) {
  config = withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application["$"] = application["$"] || {};
      application["$"]["android:usesCleartextTraffic"] =
        "${akaiunsanAllowCleartextTraffic}";
    }
    return config;
  });

  config = withGradleProperties(config, (config) => {
    const jdkHome = findJdkHome();
    const existing = new Set(
      config.modResults.map((item) => item.key)
    );
    for (const extra of GRADLE_EXTRAS) {
      if (!existing.has(extra.key)) {
        config.modResults.push({ ...extra });
      }
    }
    if (jdkHome && !existing.has("org.gradle.java.home")) {
      config.modResults.push({
        type: "property",
        key: "org.gradle.java.home",
        value: jdkHome,
      });
    }
    return config;
  });

  return withAppBuildGradle(config, (config) => {
    const contents = String(config.modResults.contents);
    if (!contents.includes(DOTENV_MARKER)) {
      config.modResults.contents = `${contents.trimEnd()}\n${DOTENV_APPLY}`;
    }
    return config;
  });
};
