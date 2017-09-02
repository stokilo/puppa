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
            "success" : false,
            "errorMessage" : "",
            
            "configuration": {
                "browserConfig": {
                    "viewport": {
                        "width": 1280,
                        "height": 1024
                    },
                    "timeout": 50000
                },
                "globalInject": [],
                "testSuite": {
                    "order": {
                        "tab1": []
                    }
                }
            }
        };

        // test configuration from a file
        const userConfiguration = JSON.parse(fs.readFileSync(commandParameters.testConfigPath, "utf8"));

        // 1. test profile
        if (!"profile" in userConfiguration) {
            testConfiguration.errorMessage = "Please defined property 'profile' that points to profile file.";
            return testConfiguration;
        }
        var profile = userConfiguration.profile;
        var profilePath = commandParameters.testDirPath + path.sep + profile;
        if (!fs.existsSync(profilePath)) {
            testConfiguration.errorMessage = "Couldn't find a profile file: " + profilePath;
            return testConfiguration;
        }
        const profileConfiguration = JSON.parse(fs.readFileSync(profilePath, "utf8"));

        // 2. browser configuration
        if ("browserConfig" in userConfiguration) {
            if ("viewport" in userConfiguration.browserConfig) {
                if ("width" in userConfiguration.browserConfig.viewport) {
                    testConfiguration.configuration.browserConfig.viewport.width = userConfiguration.browserConfig.viewport.width
                }
                if ("height" in userConfiguration.browserConfig.viewport) {
                    testConfiguration.configuration.browserConfig.viewport.height = userConfiguration.browserConfig.viewport.height
                }
            }
            if ("timeout" in userConfiguration.browserConfig) {
                testConfiguration.configuration.browserConfig.timeout = userConfiguration.browserConfig.timeout
            }
        }

        // 3. global inject js
        if ("globalInject" in userConfiguration) {
            testConfiguration.configuration.globalInject = testConfiguration.configuration.globalInject.concat(userConfiguration.globalInject);
        }

        // 4. test suite
        if ("testSuite" in userConfiguration) {
            if ("order" in userConfiguration.testSuite) {
                var order = userConfiguration.testSuite.order;
                for (var tab in order) {
                    if (order.hasOwnProperty(tab)) {
                        //testConfiguration.configuration.testSuite.order[tab] = userConfiguration.testSuite.order[tab];
                       var userTab = userConfiguration.testSuite.order[tab];
                       var finalUserTab = [];
                       for (var i = 0; i < userTab.length; i++) {
                            //perform substitution 
                            for (var placeholder in profileConfiguration.placeholders) {
                                if (profileConfiguration.placeholders.hasOwnProperty(placeholder)) {
                                    userTab[i] = userTab[i].replace("${" + placeholder + "}", profileConfiguration.placeholders[placeholder]);
                                }
                            }
                            //perform splitting test function name from url
                            //format is url.testFunctionName
                            var split = userTab[i].split(".");;
                            var testName = split[split.length-1];
                            var testUrl = userTab[i].replace(new RegExp("." + testName + '$'), '');

                            finalUserTab[i] = {
                                "url" : testUrl,
                                "testName": testName
                            }
                       }
                       testConfiguration.configuration.testSuite.order[tab] = (finalUserTab);
                    }
                } 
            }
        } 

        testConfiguration.success = true;
        return testConfiguration;
    },

    /**
     * Terminate the process if test configuration is not correct and output error message to stdout.
     */
    validateTestConfiguration: function(testConfiguration) {
        if (!testConfiguration.success) {
            console.info(testConfiguration.errorMessage);
            process.exit(1);
        }
    }

};