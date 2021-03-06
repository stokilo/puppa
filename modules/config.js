/**
 * Module for reading test configuration and converting it into puppa format.
 */
const fs = require("fs");
const path = require("path");

module.exports = {

    /**
     * Read and parse test cases configuration data.
     */
    parseConfiguration: function (parentDir, commandParameters) {
        var testConfiguration = {
            "success": false,
            "errorMessage": "",

            "configuration": {
                "chromeConfig": {
                    "flags": "--window-size=1280,720"
                },
                "browserConfig": {
                    "viewport": {
                        "width": 1280,
                        "height": 1024
                    },
                    "timeout": 50000,
                    "headless": true,
                    "dumpio": false,
                    "devtools": false,
                    "closeTab": {
                        "onFailure": false,
                        "onSuccess": true
                    }
                },
                "globalInject": [],
                "testSuite": {
                },
                "profileConfig": {}
            }
        };

        // test configuration from a file
        const userConfiguration = JSON.parse(fs.readFileSync(commandParameters.testConfigPath, "utf8"));

        // 1. test profile
        if (!"profile" in userConfiguration && !commandParameters.profile.length) {
            testConfiguration.errorMessage = "Please define property 'profile' that points to profile file or define command line param like: --p=dev1";
            return testConfiguration;
        }

        // profile defined from command line parameter overwrites profile defined in test configuration
        var profile = commandParameters.profile.length ? commandParameters.profile : userConfiguration.profile;
        console.info("Current active profile: " + profile);
        var profilePath = commandParameters.testDirPath + path.sep + profile;
        if (!fs.existsSync(profilePath)) {
            testConfiguration.errorMessage = "Couldn't find a profile file: " + profilePath;
            return testConfiguration;
        }
        const profileConfiguration = JSON.parse(fs.readFileSync(profilePath, "utf8"));

        // 2. chrome configuration
        if ("chromeConfig" in userConfiguration) {
            Object.assign(testConfiguration.configuration.chromeConfig, userConfiguration.chromeConfig);
        }

        // 3. browser configuration
        if ("browserConfig" in userConfiguration) {
            Object.assign(testConfiguration.configuration.browserConfig, userConfiguration.browserConfig);
        }
        // 3.1 Handle command line -h argument (overrule headless mode)
        if (commandParameters.headless.length) {
            if(commandParameters.headless === "true") {
                testConfiguration.configuration.browserConfig.headless = true;
            } else if(commandParameters.headless === "false") {
                testConfiguration.configuration.browserConfig.headless = false;
            }
        }

        // 4. browser configuration from profile overwrites both: initial configuration and test configuration from the file
        if ("browserConfig" in profileConfiguration) {
            Object.assign(testConfiguration.configuration.browserConfig, profileConfiguration.browserConfig);
        }
        // 4.1 Handle command line -c argument (overrule close behavior for tabs)
        if (commandParameters.closePolicy.length) {
            if (commandParameters.closePolicy === "all") {
                testConfiguration.configuration.browserConfig.closeTab.onFailure = true;
                testConfiguration.configuration.browserConfig.closeTab.onSuccess = true;
            } else if (commandParameters.closePolicy === "none") {
                testConfiguration.configuration.browserConfig.closeTab.onFailure = false;
                testConfiguration.configuration.browserConfig.closeTab.onSuccess = false;
            } else if (commandParameters.closePolicy === "passed") {
                testConfiguration.configuration.browserConfig.closeTab.onFailure = false;
                testConfiguration.configuration.browserConfig.closeTab.onSuccess = true;
            } else if (commandParameters.closePolicy === "failed") {
                testConfiguration.configuration.browserConfig.closeTab.onFailure = true;
                testConfiguration.configuration.browserConfig.closeTab.onSuccess = false;
            }
        }

        // 5. global inject js
        if ("globalInject" in userConfiguration) {
            testConfiguration.configuration.globalInject = testConfiguration.configuration.globalInject.concat(userConfiguration.globalInject);
        }

        // 6. test suite
        if ("testSuite" in userConfiguration) {
            for (var suite in userConfiguration.testSuite) {
                var tabs = userConfiguration.testSuite[suite];
                for (var tab in tabs) {
                    if (userConfiguration.testSuite[suite].hasOwnProperty(tab)) {
                        var userTab = tabs[tab];
                        var finalUserTab = [];
                        for (var i = 0; i < userTab.length; i++) {
                            //save original test name for future use
                            var originalTestName = userTab[i];
                            //perform substitution 
                            for (var placeholder in profileConfiguration.placeholders) {
                                if (profileConfiguration.placeholders.hasOwnProperty(placeholder)) {
                                    userTab[i] = userTab[i].replace("${" + placeholder + "}", profileConfiguration.placeholders[placeholder]);
                                }
                            }
                            //perform splitting test function name from url
                            //format is url.testFunctionName
                            var split = userTab[i].split(".");;
                            var testName = split[split.length - 1];
                            var testUrl = userTab[i].replace(new RegExp("." + testName + '$'), '');

                            finalUserTab[i] = {
                                "url": testUrl,
                                "testName": testName,
                                "originalTestName": originalTestName
                            }
                        }
                        if(!(suite in testConfiguration.configuration.testSuite)) {
                            testConfiguration.configuration.testSuite[suite] = {};                            
                        }
                        if(!(tab in testConfiguration.configuration.testSuite[suite])) {
                            testConfiguration.configuration.testSuite[suite][tab] = [];
                        }
                        

                        testConfiguration.configuration.testSuite[suite][tab] = (finalUserTab);
                    }
                }
            }
        }

        // 7. profile configuration
        testConfiguration.configuration.profileConfig = profileConfiguration.config;

        testConfiguration.success = true;
        return testConfiguration;
    },

    /**
     * Terminate the process if test configuration is not correct and output error message to stdout.
     */
    validateTestConfiguration: function (testConfiguration) {
        if (!testConfiguration.success) {
            console.info(testConfiguration.errorMessage);
            process.exit(1);
        }
    }

};