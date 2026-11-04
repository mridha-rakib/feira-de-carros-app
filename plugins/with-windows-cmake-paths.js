const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

const marker = '// fikiflow-windows-cmake-staging';
const staging = `
${marker}
// Short generated paths keep codegen object files within older Ninja's limits.
if (System.getProperty('os.name').toLowerCase().contains('windows')) {
  def checkoutKey = Integer.toHexString(rootProject.projectDir.absolutePath.hashCode())
  android.externalNativeBuild.cmake.buildStagingDirectory = new File(System.getProperty('user.home'), ".cxx/fiki/" + checkoutKey)
}
`;

/** Expo defaults to 1024; older Windows Ninja cannot create those object paths. */
module.exports = function withWindowsCmakePaths(config) {
  if (process.platform !== 'win32') return config;
  const configured = withGradleProperties(config, (result) => {
    const key = 'expo.android.cmakeObjectPathMax';
    result.modResults = result.modResults.filter(
      (entry) => entry.type !== 'property' || entry.key !== key,
    );
    result.modResults.push({ type: 'property', key, value: '250' });
    return result;
  });
  return withAppBuildGradle(configured, (result) => {
    if (result.modResults.language !== 'groovy') {
      throw new Error('Windows CMake staging expects the Expo Groovy app template');
    }
    if (!result.modResults.contents.includes(marker)) result.modResults.contents += staging;
    return result;
  });
};
