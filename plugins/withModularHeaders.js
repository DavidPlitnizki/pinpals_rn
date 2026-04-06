const { withPodfile } = require("expo/config-plugins");

module.exports = function withFirebasePodfix(config) {
  return withPodfile(config, (config) => {
    let podfile = config.modResults.contents;

    // Add use_modular_headers! for Firebase Swift pods
    if (!podfile.includes("use_modular_headers!")) {
      podfile = podfile.replace(
        "prepare_react_native_project!",
        "prepare_react_native_project!\n\nuse_modular_headers!"
      );
    }

    // Convert Firebase Swift pods to dynamic frameworks in pre_install
    // (same pattern as @rnmapbox/maps uses for Mapbox pods)
    const firebasePreInstall = `
    # Firebase Swift pods need dynamic framework build type
    firebase_dynamic_pods = ['FirebaseAuth', 'FirebaseCoreInternal', 'FirebaseCore', 'FirebaseCoreExtension', 'FirebaseAppCheckInterop', 'FirebaseAuthInterop', 'GoogleUtilities', 'RecaptchaInterop', 'GTMSessionFetcher']
    installer.aggregate_targets.each do |target|
      target.pod_targets.select { |p| firebase_dynamic_pods.include?(p.name) }.each do |pod_target|
        pod_target.instance_variable_set(:@build_type, Pod::BuildType.dynamic_framework)
        puts "* [Firebase] Changed #{pod_target.name} to dynamic framework"
      end
    end`;

    if (!podfile.includes("[Firebase] Changed")) {
      podfile = podfile.replace(
        "$RNMapboxMaps.pre_install(installer)",
        "$RNMapboxMaps.pre_install(installer)" + firebasePreInstall
      );
    }

    config.modResults.contents = podfile;
    return config;
  });
};
