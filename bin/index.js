#!/usr/bin/env node

const chalk = require("chalk");
const boxen = require("boxen");
const { RTMClient } = require('@slack/rtm-api');
const readline = require('readline');
const { exec } = require("child_process");
const path = require('path');
const greeting = chalk.white.bold("Welcome");
const spawn = require('cross-spawn');
var glob = require("glob");
var inquirer = require('inquirer');

//const cmd = spawn("gradlew", ["clean", "assembleRelease"], {cwd: "../../android"});

//process.exit(1);

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
        //return process.cwd() + path.sep + val;
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
    //console.log(JSON.stringify(answers, null, '  '));
    console.log(chalk.green.bold("-- Building the apk --"));
    const mainCmd = answers.gradleCmd.shift();
    console.log(answers.androidDir);
    console.log(mainCmd);
    console.log(answers.gradleCmd);
    const cmd = spawn(mainCmd, answers.gradleCmd, {cwd: `'/${answers.androidDir}'`});
    cmd.stdout.on("data", data => {
        console.log(`${data}`);
    });

    cmd.stderr.on("data", data => {
        console.log(`stderr: ${data}`);
        process.exit(1);
    });

    cmd.on('error', (error) => {
        console.log(`Erro occured: ${error.message}`);
        process.exit(1);
    });

    cmd.on("close", code => {
        console.log(chalk.green.bold("-- Build successful --"));

        // after build finishes, prompt to select an apk
        glob("**/*.apk", {cwd: answers.androidDir }, function (er, files) {
            if (files.length) {

                var choices = [];

                files.map( function(val, index) {
                    choices.push(val);
                    // console.log("[ ] " + path.basename(val) + " \n");
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
                    }
                  ])
                  .then(answers => {
                    console.log(JSON.stringify(answers, null, '  '));
                  });

            }
        });

    });
  });




/*console.log(chalk.green.bold("-- Building the apk --"))
const cmd = spawn("gradlew", ["clean", "assembleRelease"], {cwd:"../cookups/diner-app/android"});
cmd.stdout.on("data", data => {
    console.log(`${data}`);
});

cmd.stderr.on("data", data => {
    console.log(`stderr: ${data}`);
});

cmd.on('error', (error) => {
    console.log(`error: ${error.message}`);
});

cmd.on("close", code => {
    console.log(`child process exited with code ${code}`);
});*/

/*exec("cd ../loc/android", (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    
    console.log(chalk.green.bold("-- Building the apk --"))
    const cmd = spawn("gradlew", ["clean", "assembleRelease"], {cwd:"../loc/android"});
	cmd.stdout.on("data", data => {
	    console.log(`${data}`);
	});

	cmd.stderr.on("data", data => {
	    console.log(`stderr: ${data}`);
	});

	cmd.on('error', (error) => {
	    console.log(`error: ${error.message}`);
	});

	cmd.on("close", code => {
	    console.log(`child process exited with code ${code}`);
	});
});*/

