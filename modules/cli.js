/**
 * Module to implement CLI for puppa.
 */
const fs = require("fs");
const path = require("path");
const minimist = require("minimist")

// test cases configuration file name
const testConfigFileName = "test-config.json";

module.exports = {

    /**
     * Process entered command with parameters and return test runner data.
     */
    processCommand: function (rootDir) {

        var result = {
            "success": false,
            "errorMessage": "",

            "rootDir" : "",
            "testDirName": "",
            "testDirPath": "",
            "testConfigPath": ""
        };

        // command line arguments processing
        const argv = minimist(process.argv.slice(2));
        if (!"_" in argv || !argv._.length) {
            result.errorMessage = "Please provide path to directory that contains test files i.e. node index.js tests";
            return result;
        }

        result.rootDir = rootDir;
        result.testDirName = argv._[0];
        result.testDirPath = rootDir + path.sep + result.testDirName;
        result.testConfigPath = result.testDirPath + path.sep + testConfigFileName;

        if (!fs.existsSync(result.testDirPath)) {
            result.errorMessage = "Check if following directory with tests exists: " + result.testDirName;
            return result;
        }
        if (!fs.existsSync(result.testConfigPath)) {
            result.errorMessage = "Could not find test config: " + result.testConfigPath;
            return result;
        }

        result.success = true;
        return result;
    },

    /**
     * Terminate process in case of incorrect configuration.
     * Output success or error message.
     */
    validateProcessCommandResult: function(commandResult) {
        if (!commandResult.success) {
            console.info(commandResult.errorMessage);
            process.exit(1);
        } else {
            console.info("Running tests from directory: " + commandResult.testDirName);
        }
    }

};