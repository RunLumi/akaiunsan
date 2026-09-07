const { withPodfile } = require("@expo/config-plugins");

const PODFILE_PROLOGUE = `$RNFirebaseDisableSPM = true
use_frameworks! :linkage => :static

`;

module.exports = function withFirebaseDisableSpm(config) {
  return withPodfile(config, (config) => {
    if (String(config.modResults.contents).includes("use_frameworks! :linkage => :static")) {
      return config;
    }
    config.modResults.contents = PODFILE_PROLOGUE + String(config.modResults.contents);
    return config;
  });
};