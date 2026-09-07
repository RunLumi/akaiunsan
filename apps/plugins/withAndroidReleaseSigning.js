const { withAppBuildGradle } = require("@expo/config-plugins");

const SIGNING_MARKER = "// @akaiunsan-release-signing";

const SIGNING_BLOCK = `
    ${SIGNING_MARKER}
    def releaseStoreFile = System.getenv("ANDROID_SIGNING_STORE_FILE") ?: findProperty("akaiunsanReleaseStoreFile")
    def releaseStorePassword = System.getenv("ANDROID_SIGNING_STORE_PASSWORD") ?: findProperty("akaiunsanReleaseStorePassword")
    def releaseKeyAlias = System.getenv("ANDROID_SIGNING_KEY_ALIAS") ?: findProperty("akaiunsanReleaseKeyAlias")
    def releaseKeyPassword = System.getenv("ANDROID_SIGNING_KEY_PASSWORD") ?: findProperty("akaiunsanReleaseKeyPassword")
    def hasReleaseSigning = [releaseStoreFile, releaseStorePassword, releaseKeyAlias, releaseKeyPassword].every { it }
    if (hasReleaseSigning) {
        signingConfigs {
            release {
                storeFile file(releaseStoreFile)
                storePassword releaseStorePassword
                keyAlias releaseKeyAlias
                keyPassword releaseKeyPassword
            }
        }
    }
`;

function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = String(config.modResults.contents);
    if (contents.includes(SIGNING_MARKER)) {
      return config;
    }

    const releaseSigning =
      "signingConfig signingConfigs.debug";
    const generatedSigning =
      "signingConfig (hasReleaseSigning ? signingConfigs.release : signingConfigs.debug)";

    contents = contents.replace(SIGNING_BLOCK, "");
    contents = contents.replace(
      "    buildTypes {",
      `${SIGNING_BLOCK}\n    buildTypes {`
    );

    const buildTypesIndex = contents.indexOf("    buildTypes {");
    const releaseIndex = contents.indexOf("        release {", buildTypesIndex);
    if (buildTypesIndex >= 0 && releaseIndex >= 0) {
      const signingIndex = contents.indexOf(releaseSigning, releaseIndex);
      if (signingIndex >= 0) {
        contents =
          contents.slice(0, signingIndex) +
          contents.slice(signingIndex).replace(releaseSigning, generatedSigning);
      }
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withAndroidReleaseSigning;
