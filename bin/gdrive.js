const fs = require('fs');
const path = require("path");
const readline = require('readline');
const {google} = require('googleapis');
const cliProgress = require('cli-progress');
const chalk = require("chalk");
const homedir = require('os').homedir();
const isWin = process.platform === "win32";
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = homedir + '/token.json';

// Load client secrets from a local file.
function initUpload(filepath, filename) {
  fs.readFile(homedir + '/credentials.json', (err, content) => {
    if (err) {
      console.log(chalk.red.bold('Couldn\'t find credentials.json file inside your home directory.'));
      process.exit(1);
    }
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), upload, filepath, filename);
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, filepath, filename) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, filepath, filename);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}


// upload file to gdrive
async function upload(auth, filepath, filename) {
  fileName = isWin ? filename.replace("/", "\\") : filename;
  const fileToUpload = process.cwd() + path.sep + filepath;
  const fileSize = fs.statSync(fileToUpload).size;

  const drive = google.drive({version: 'v3', auth});
  const fileMetadata = {
    'name': filename + '.apk'
  };

  progressBar.start(100, 0);
  const res = await drive.files.create(
    {
      resource: fileMetadata,
      requestBody: {
        // a requestBody element is required if you want to use multipart
        'name': filename + '.apk'
      },
      media: {
        body: fs.createReadStream(fileName),
      },
    },
    {
      // Use the `onUploadProgress` event from Axios to track the
      // number of bytes uploaded to this point.
      onUploadProgress: evt => {
        const progress = (evt.bytesRead / fileSize) * 100;
        progressBar.update(Math.round(progress));
        // readline.clearLine();
        // readline.cursorTo(0);
        //process.stdout.write(`${Math.round(progress)}% complete`);
      },
    }
  );
  progressBar.stop();
  console.log('Your apk is uploaded at: www.drive.google.com/open?id=' + res.data.id);
  process.exit(1);
}

module.exports = initUpload;
