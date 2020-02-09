#!/usr/bin/env node

const chalk = require("chalk");
const boxen = require("boxen");
const path = require('path');
const greeting = chalk.white.bold("Welcome");
const spawn = require('cross-spawn');
var glob = require("glob");
var inquirer = require('inquirer');
const initUpload = require('./gdrive')
const isWin = process.platform === "win32";

const boxenOptions = {
 padding: 1,
 margin: 1,
 borderStyle: "round",
 borderColor: "green",
 backgroundColor: "#555555"
};
const msgBox = boxen( greeting, boxenOptions );

console.log(msgBox);

// select android project directory
inquirer
  .prompt([
    {
      type: 'input',
      name: 'androidDir',
      message: 'Where is the android project located?',
      default: 'android',
      filter: function(val) {
        return val;
      }
    },
    {
      type: 'input',
      name: 'gradleCmd',
      message: 'What gradle command should be run to build the apk?',
      default: 'gradlew clean assembleRelease',
      filter: function(val) {
        return val.split(" ");
      }
    }
  ])
  .then(answers => {
    console.log(chalk.green.bold("-- Building the apk --"));
    const mainCmd = answers.gradleCmd.shift();
    const cwd = process.cwd() + path.sep + answers.androidDir;
    const cmd = spawn(mainCmd, answers.gradleCmd, {cwd: cwd});
    cmd.stdout.on("data", data => {
        console.log(`${data}`);
    });

    cmd.stderr.on("data", data => {
        console.log(`stderr: ${data}`);
    });

    cmd.on('error', (error) => {
        console.log(`Erro occured: ${error.message}`);
    });

    cmd.on("close", code => {
        console.log(chalk.green.bold("-- Build successful --"));

        // after build finishes, prompt to select an apk
        glob("**/*.apk", {cwd: cwd }, function (er, files) {
            if (files.length) {

                var choices = [];

                files.map( function(val, index) {
                    choices.push(val);
                });

                // show prompt
                inquirer
                  .prompt([
                    {
                      type: 'list',
                      name: 'apk',
                      message: 'Please select an apk to distribute',
                      choices: choices,
                      /*filter: function(val) {
                        return path.basename(val);
                      }*/
                    },
                    {
                      type: 'input',
                      name: 'fileName',
                      message: 'File name?',
                      filter: function(val) {
                        return val;
                      }
                    }
                  ])
                  .then(answers => {
                    const filepath = isWin ? answers.apk.replace(/\//g, path.sep) : answers.apk;
                    initUpload(cwd + path.sep + filepath, answers.fileName);
                  });

            }
        });

    });
  });