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

            "profile": "",
            "suites": "",
            "headless": "",
            "closePolicy": "",

            "rootDir": "",
            "testDirName": "",
            "testDirPath": "",
            "testConfigPath": "",

            "mode": ""
        };

        // command line arguments processing
        const argv = minimist(process.argv.slice(2));
        if (!"_" in argv || !argv._.length) {
            result.errorMessage = "Please provide path to directory that contains test files i.e. node index.js tests";
            return result;
        }

        // define profile, format is like following: node index.js tests --p=dev1
        if ("p" in argv && argv.p.length) {
            result.profile = argv.p + ".json";
        }

        // define test suite to run, to run tests only from 'dev' suite: node index.js tests --s=dev
        if ("s" in argv && argv.s.length) {
            result.suites = argv.s.split(',');
        }

        // define test run mode -m=session (start testing session, every failed test will be copied into new 'session' test suite for rerun)
        if ("m" in argv && argv.m.length) {
            result.mode = argv.m;
        }

        // overrule headless parameter from test-config.json  -h=true (headless) or -h=false then show browser window
        if ("h" in argv && argv.h.length) {
            result.headless = argv.h;
        }

        // overrule tabs close behavior
        // -c=all close all tabs regardless of test result
        // -c=none remain open all tabs regardless of test result
        // -c=failed close only failed tabs
        // -c=passed close only passed tabs
        if ("c" in argv && argv.c.length) {
            result.closePolicy = argv.c;
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
    validateProcessCommandResult: function (commandResult) {
        if (!commandResult.success) {
            console.info(commandResult.errorMessage);
            process.exit(1);
        } else {
            console.info("Running tests from directory: " + commandResult.testDirName);
        }
    },

    /**
     * Convert milisecond into mm:ss format
     */
    millisToMinutesAndSeconds: function (millis) {
        var minutes = Math.floor(millis / 60000);
        var seconds = ((millis % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    }

};