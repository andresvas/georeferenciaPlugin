#!/usr/bin/env node

module.exports = function(context) {
    var ANDROID = 'android';
    var platformsList = context.opts.platforms;
    platformsList.forEach(function(platform) {
        switch (platform) {
            case ANDROID:
                {
                    runModifyManifest(context);
                    break;
                }
        }
    });




};


function runModifyManifest(context) {

    let fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path');

    // android platform directory
    let platformAndroidDir = path.join(context.opts.projectRoot, 'platforms/android');

    // android app module directory
    let platformAndroidAppModuleDir = path.join(platformAndroidDir, 'app');

    // android manifest file
    let androidManifestFile = path.join(platformAndroidAppModuleDir, 'src/main/AndroidManifest.xml');

    if (fs.existsSync(androidManifestFile)) {

        fs.readFile(androidManifestFile, 'UTF-8', function(err, data) {
            if (err) {
                throw new Error('Unable to find AndroidManifest.xml: ' + err);
            }

            // the Android Application class that need to config to Android manifest file
            let applicationStyleName = '@style/AppTheme.NoActionBar';

            if (data.indexOf(applicationStyleName) === -1) {

                var result = data.replace(/<application/g, '<application android:theme="' + applicationStyleName + '"');

                // the Android Application class that need to config to Android manifest file
                let applicationClearTrafficName = 'android:usesCleartextTraffic="true"';

                if (data.indexOf(applicationClearTrafficName) === -1) {

                    result = result.replace(/<application/g, '<application ' + applicationClearTrafficName);
                }




                // the Android Application class that need to config to Android manifest file
                let applicationSupportsRtl = 'android:supportsRtl="true"';

                if (data.indexOf(applicationSupportsRtl) != -1) {

                    result = result.replace(applicationSupportsRtl, '');
                }


                // the Android Application class that need to config to Android manifest file
                let applicationAllowBackup = 'android:allowBackup="false"';

                if (data.indexOf(applicationAllowBackup) === -1) {

                    result = result.replace(/<application/g, '<application ' + applicationAllowBackup);
                }





                // the Android Application class that need to config to Android manifest file
                let applicationnetworkSecurityConfig = 'android:networkSecurityConfig="@xml/network_security"';

                if (data.indexOf('android:networkSecurityConfig="@xml/network_security_config"') === -1) {

                    result = result.replace(/<application/g, '<application ' + applicationnetworkSecurityConfig);
                } else if (data.indexOf('android:networkSecurityConfig="@xml/network_security_config"') != -1) {
                    result = result.replace('android:networkSecurityConfig="@xml/network_security_config"', applicationnetworkSecurityConfig);
                }



                // the Android Application class that need to config to Android manifest file
                let applicationSandboxVersion = 'android:targetSandboxVersion';

                if (data.indexOf(applicationSandboxVersion) === -1) {

                    result = result.replace(/<manifest/g, '<manifest ' + applicationSandboxVersion + '="1"');
                } else if (data.indexOf(applicationSandboxVersion + '="2"') != -1) {
                    result = result.replace(applicationSandboxVersion + '="2"', applicationSandboxVersion + '="1"');
                }
                // ---------------------- start text

                // the Android Application class that need to config to Android manifest file
                let applicationHardware = 'android:hardwareAccelerated="true"';

                if (data.indexOf(applicationHardware) === -1) {

                    result = result.replace(/<manifest/g, '<manifest ' + applicationHardware);
                }

                // the Android Application class that need to config to Android manifest file
                let applicationInstallLocation = 'android:installLocation="auto"';

                if (data.indexOf(applicationInstallLocation) === -1) {

                    result = result.replace(/<manifest/g, '<manifest ' + applicationInstallLocation);
                }

                // --------------------- end text

                fs.writeFile(androidManifestFile, result, 'UTF-8', function(err) {
                    if (err)
                        throw new Error('Unable to write into AndroidManifest.xml: ' + err);
                })

            }
        });

    }

}