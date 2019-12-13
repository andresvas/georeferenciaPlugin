// global vars

module.exports = function (context) {
    const fs = context.requireCordovaModule("fs"),
        path = context.requireCordovaModule("path"),
        et = context.requireCordovaModule("elementtree"),
        plist = context.requireCordovaModule('plist');

    const cordovaUtil = context.requireCordovaModule('cordova-lib/src/cordova/util');
    const rootdir = cordovaUtil.isCordova();

    const platformConfig = (function () {
        let configXmlData;

        return {
            // Parses a given file into an elementtree object
            parseElementtreeSync: function (filename) {
                var contents = fs.readFileSync(filename, 'utf-8');
                if (contents) {
                    //Windows is the BOM. Skip the Byte Order Mark.
                    contents = contents.substring(contents.indexOf('<'));
                }
                return new et.ElementTree(et.XML(contents));
            },

            // Converts an elementtree object to an xml string.  Since this is used for plist values, we don't care about attributes
            eltreeToXmlString: function (data) {
                const tag = data.tag;
                let el = '<' + tag + '>';

                if (data.text && data.text.trim()) {
                    el += data.text.trim();
                } else {
                    data.getchildren().forEach(function (child) {
                        el += platformConfig.eltreeToXmlString(child);
                    });
                }

                el += '</' + tag + '>';
                return el;
            },

            // Parses the config.xml into an elementtree object and stores in the config object
            getConfigXml: function (file) {
                if (!configXmlData) {
                    configXmlData = this.parseElementtreeSync(file);
                }

                return configXmlData;
            },

            /* Retrieves all <preferences ..> from config.xml and returns a map of preferences with platform as the key.
               If a platform is supplied, common prefs + platform prefs will be returned, otherwise just common prefs are returned.
             */
            getPreferences: function (platform, file) {
                const configXml = this.getConfigXml(file);
                let preferencesData = {
                    common: configXml.findall('preference')
                };
                let prefs = preferencesData.common || [];
                if (platform) {
                    if (!preferencesData[platform]) {
                        preferencesData[platform] = configXml.findall('platform[@name=\'' + platform + '\']/preference');
                    }
                    prefs = prefs.concat(preferencesData[platform]);
                }

                return prefs;
            },

            /* Retrieves all configured xml for a specific platform/target/parent element nested inside a platforms config-file
               element within the config.xml.  The config-file elements are then indexed by target|parent so if there are
               any config-file elements per platform that have the same target and parent, the last config-file element is used.
             */
            getConfigFilesByTargetAndParent: function (platform) {
                const configFileData = this.getConfigXml().findall('platform[@name=\'' + platform + '\']/config-file');

                let result = {};

                configFileData.forEach(function (item) {

                    let parent = item.attrib.parent;
                    //if parent attribute is undefined /* or */, set parent to top level elementree selector
                    if (!parent || parent === '/*' || parent === '*/') {
                        parent = './';
                    }
                    const key = item.attrib.target + '|' + parent;

                    result[key] = item;
                });

                return result;
            },

            // Parses the config.xml's preferences and config-file elements for a given platform
            parseConfigXml: function (platform) {
                const configData = {};
                this.parsePreferences(configData, platform);
                this.parseConfigFiles(configData, platform);

                return configData;
            },

            // Retrieves the config.xml's pereferences for a given platform and parses them into JSON data
            parsePreferences: function (configData, platform) {
                const preferences = this.getPreferences(platform, path.join(rootdir, 'config.xml')),
                    type = 'preference';

                preferences.forEach(function (preference) {
                    // check if there are specific configuration to map to config for this platform
                    if (!preferenceMappingData[platform]) {
                        return;
                    }
                    const prefMappingData = preferenceMappingData[platform][preference.attrib.name];
                    let target,
                        prefData;

                    if (prefMappingData) {
                        prefData = {
                            parent: prefMappingData.parent,
                            type: type,
                            destination: prefMappingData.destination,
                            data: preference
                        };

                        target = prefMappingData.target;
                        if (!configData[target]) {
                            configData[target] = [];
                        }
                        configData[target].push(prefData);
                    }
                });
            },

            // Retrieves the config.xml's config-file elements for a given platform and parses them into JSON data
            parseConfigFiles: function (configData, platform) {
                const configFiles = this.getConfigFilesByTargetAndParent(platform),
                    type = 'configFile';

                for (let key in configFiles) {
                    if (configFiles.hasOwnProperty(key)) {
                        const configFile = configFiles[key];

                        const keyParts = key.split('|');
                        const target = keyParts[0];
                        const parent = keyParts[1];
                        const items = configData[target] || [];

                        configFile.getchildren().forEach(function (element) {
                            items.push({
                                parent: parent,
                                type: type,
                                destination: element.tag,
                                data: element
                            });
                        });

                        configData[target] = items;
                    }
                }
            },

            // Parses config.xml data, and update each target file for a specified platform
            updatePlatformConfig: function (platform) {
                const configData = this.parseConfigXml(platform),
                    platformPath = path.join(rootdir, 'platforms', platform);

                for (let targetFileName in configData) {
                    if (configData.hasOwnProperty(targetFileName)) {
                        const configItems = configData[targetFileName];

                        let projectName, targetFile;

                        if (platform === 'ios' && targetFileName.indexOf("Info.plist") > -1) {
                            projectName = platformConfig.getConfigXml().findtext('name');
                            targetFile = path.join(platformPath, projectName, projectName + '-Info.plist');
                            platformConfig.updateIosPlist(targetFile, configItems);
                        } else if (platform === 'android' && targetFileName === 'AndroidManifest.xml') {
                            targetFile = getAndroidManifestFilePath(rootdir);
                            platformConfig.updateAndroidManifest(targetFile, configItems);
                        }
                    }
                }
            },

            getMainAndroidActivityNode: function (rootManifest) {
                const cordovaApp = "application/activity/intent-filter/action[@android:name='android.intent.action.MAIN']/../..";
                const tempNode = rootManifest.find(cordovaApp);
                return tempNode;
            },

            // Updates the AndroidManifest.xml target file with data from config.xml
            updateAndroidManifest: function (targetFile, configItems) {
                const tempManifest = platformConfig.parseElementtreeSync(targetFile),
                    root = tempManifest.getroot();
                const mainActivity = platformConfig.getMainAndroidActivityNode(root);

                configItems.forEach(function (item) {

                    let parentEl;
                    if (item.parent === "__cordovaMainActivity__") {
                        parentEl = mainActivity;
                    } else {
                        // if parent is not found on the root, child/grandchild nodes are searched
                        parentEl = root.find(item.parent) || root.find('*/' + item.parent);
                    }

                    const data = item.data;
                    let childSelector = item.destination,
                        childEl;

                    if (!parentEl) {
                        return;
                    }

                    if (item.type === 'preference') {
                        parentEl.attrib[childSelector] = data.attrib['value'];
                    } else {
                        // since there can be multiple uses-permission elements, we need to select them by unique name
                        if (childSelector === 'uses-permission') {
                            childSelector += '[@android:name=\'' + data.attrib['android:name'] + '\']';
                        }

                        childEl = parentEl.find(childSelector);
                        // if child element doesnt exist, create new element
                        if (!childEl) {
                            childEl = new et.Element(item.destination);
                            parentEl.append(childEl);
                        }

                        if (typeof data === "object") {
                            // copy all config.xml data except for the generated _id property
                            for (let key in data) {
                                // skip loop if the property is from prototype
                                if (!data.hasOwnProperty(key)) continue;

                                if (key !== '_id') {
                                    childEl[key] = data[key];
                                }
                            }
                        }
                    }
                });

                fs.writeFileSync(targetFile, tempManifest.write({indent: 4}), 'utf-8');
                console.log("Wrote AndroidManifest.xml: " + targetFile);
            },

            /* Updates the *-Info.plist file with data from config.xml by parsing to an xml string, then using the plist
               module to convert the data to a map.  The config.xml data is then replaced or appended to the original plist file
             */
            updateIosPlist: function (targetFile, configItems) {
                const infoPlist = plist.parse(fs.readFileSync(targetFile, 'utf-8'));
                let tempInfoPlist;

                configItems.forEach(function (item) {
                    const key = item.parent;
                    const plistXml = '<plist><dict><key>' + key + '</key>' +
                        platformConfig.eltreeToXmlString(item.data) + '</dict></plist>';

                    const configPlistObj = plist.parse(plistXml);
                    infoPlist[key] = configPlistObj[key];
                });

                tempInfoPlist = plist.build(infoPlist);
                tempInfoPlist = tempInfoPlist.replace(/<string>[\s\r\n]*<\/string>/g, '<string></string>');
                fs.writeFileSync(targetFile, tempInfoPlist, 'utf-8');
                console.log("Wrote iOS Plist: " + targetFile);
            }
        };
    })();

    function parseLibs1(env) {
        var libLoc = "platforms/android/app/src/main/libs/";
        var envSuffix = "_" + env;
        console.log("Processing libs for environment " + env);
        //improve parse all files with suffix ${envSuffix} and remove it
        fs.renameSync(libLoc + "bancolombialibrary" + envSuffix + ".aar", libLoc + "bancolombialibrary.aar");

        let regex = /bancolombialibrary_.+$/;
        fs.readdirSync(libLoc)
            .filter(f => regex.test(f))
            .map(f => fs.unlinkSync(libLoc + f));
    }
    
    const preferences = platformConfig.getPreferences('android', 'config.xml');
    var parsed = false;
    for (i = 0; i < preferences.length; i++) {
        if ('environment' === preferences[i].attrib.name.toLowerCase()) {
            var env = ((!preferences[i].attrib.value || preferences[i].attrib.value === '') ? preferences[i].attrib.default : preferences[i].attrib.value);
            parseLibs1(env);
            parseLibs2(env);
            parsed = true;
        }
    }
    if (!parsed) {
        console.log("No preference ENVIRONMENT found in config.xml. Using default 'qa'");
        parseLibs1('qa');
        parseLibs2('qa');
    }
};
