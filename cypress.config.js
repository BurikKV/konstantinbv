const { defineConfig } = require('cypress'); // Import defineConfig from Cypress to manage project configuration
const { allureCypress } = require("allure-cypress/reporter"); // Integrate Allure reporter for generating test reports
const { removeDirectory } = require('cypress-delete-downloads-folder'); // Helper to remove the downloads folder after tests
const { readdirSync, lstatSync } = require('fs'); // FS utilities for reading directory contents and file stats
const { writeFileSync } = require('fs'); // FS utilities for writinf directory contents and file stats
const path = require('path'); // Node.js path module for handling file paths
const fs = require('fs'); // Node.js file system module for file operations
const gmailTester = require("gmail-tester"); // Library for fetching and handling Gmail messages
const twilio = require('twilio'); // Twilio for sending/receiving SMS messages
const pdfParse = require('pdf-parse'); // PDF-parse for extracting text from PDF files
const XLSX = require('xlsx'); // XLSX library for working with Excel files
const mammoth = require('mammoth'); // For extracting plain text from DOCX files
require('dotenv').config() // Load environment variables from .env file

async function readDocx(filePath) { // Reads and cleans text from a DOCX file.
  const fileBuffer = fs.readFileSync(path.resolve(filePath));
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const cleanedContent = result.value.replace(/[\n\t]+/g, ' ');
    return cleanedContent;
  } catch (error) {
    throw new Error('Error reading DOCX file: ' + error.message);
  }
}

module.exports = defineConfig({
  e2e: {
    experimentalModifyObstructiveThirdPartyCode: true, // Enabling modifications for third-party code
    specPattern: [ // Pattern wich test files shoukd cypress see
      'cypress/e2e/*_test.cy.js',
      'cypress/e2e/prod_env_test/**/*.cy.js'
    ],
    browser: 'chrome',
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
          // For Chromium-based browsers (excluding Electron), 
          // use photo.y4m as a fake video source instead of a real webcam feed.
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          const iPath = path.resolve(config.projectRoot, 'cypress', 'fixtures', 'photo.y4m');
          launchOptions.args.push(`--use-file-for-fake-video-capture=${iPath}`);
        }
        return launchOptions;
      });
      on('task', {
        docImage() { // Switch the fake camera feed to doc.y4m
          console.log('TASK - Switching to doc image (doc.y4m)');
          const dociPath = path.join('cypress', 'fixtures', 'doc.y4m');
          const photoiPath = path.join('cypress', 'fixtures', 'photo.y4m');
          fs.writeFileSync(photoiPath, fs.readFileSync(dociPath));
          return null;
        },
        copyFiles({ doc, photo }) { // Copy doc.y4m and photo.y4m from given fixture folders
          console.log('TASK - Copy TestFiles');
          const sourceDocDir = path.join(config.projectRoot, 'cypress', 'fixtures', doc);
          const sourcePhotoDir = path.join(config.projectRoot, 'cypress', 'fixtures', photo);
          const targetDir = path.join(config.projectRoot, 'cypress', 'fixtures');
          fs.copyFileSync(path.join(sourceDocDir, 'doc.y4m'), path.join(targetDir, 'doc.y4m'));
          fs.copyFileSync(path.join(sourcePhotoDir, 'photo.y4m'), path.join(targetDir, 'photo.y4m')
          );
          return null;
        },
        fetchSMS() { // Fetch the latest SMS via Twilio
          const client = twilio(config.env.twSID, config.env.twToken);
          return client.messages.list({
            to: config.env.twPhone, // Twilio phone number
            limit: 10 // Fetching the last 10 messages
          }).then(messages => {
            // Returning a simplified array of message bodies for ease of use in tests
            return messages.map(msg => ({body: msg.body, from: msg.from}));
          }).catch(err => {
            // Handling errors
            console.error('Twilio API error:', err);
            return [];
          });
        },
        "gmail:get-messages": async (args) => { // Repeatedly fetch Gmail messages
          const maxAttempts = 6; // Total attempts
          const interval = 5000; // Wait 5 seconds between attempts
          let attempts = 0;
      
          const fetchEmails = async () => {
            const messages = await gmailTester.get_messages(
              path.resolve(__dirname, './node_modules/gmail-tester/credentials.json'),
              path.resolve(__dirname, './node_modules/gmail-tester/token.json'),
              args.options
            );
      
            if (messages.length > 0 || attempts >= maxAttempts) {
              return messages; // Return the emails if found or maximum attempts are reached
            } else {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, interval)); // Wait for interval
              return fetchEmails(); // Retry fetching emails
            }
          };
          return fetchEmails();
        }, 
        readDocx({ filePath }) { // Read text from a DOCX file
          return readDocx(filePath);
        },
        getPdfContent: (filePath) => { // Extract text content from a PDF
          const dataBuffer = fs.readFileSync(filePath);
          return pdfParse(dataBuffer).then(function (data) {
            return data.text; // return the text content of the PDF
          });
        },
        getLastDownloadedFile() { // Get the most recently downloaded file
          const dirPath = path.join(config.projectRoot, 'cypress/downloads');
          const filesOrdered = readdirSync(dirPath)
            .map(entry => path.join(dirPath, entry))
            .filter(entryWithPath => lstatSync(entryWithPath).isFile())
            .map(fileName => ({ fileName, mtime: lstatSync(fileName).mtime }))
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
            return filesOrdered.length ? filesOrdered[0].fileName : null;
        },
        convertXLsxToJson(filePath) { // Convert an XLSX file to JSON
          const workbook = XLSX.readFile(filePath)
          const jsonData = {};// function to work with all sheets
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            jsonData[sheetName] = XLSX.utils.sheet_to_json(worksheet);
          });
          // const worksheet = workbook.Sheets[workbook.SheetNames[1]]; //only for 1 sheet
          // const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const fileName = path.basename(filePath, '.xlsx')
          const jsonFilePath = `./cypress/fixtures/ExcelData.json`
          writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2))
          return null
        },
        removeDirectory // Task to remove a directory  
      });
      allureCypress(on); // Enable Allure reporting
      return config;
    },
    env: { // Environment variables loaded from .env
      urlSite: process.env.URL_SITE,
      urlAdmin: process.env.URL_ADMIN,
      userLogin: process.env.USER_LOGIN,
      userPass: process.env.USER_PASSWORD,
      adminLogin: process.env.ADMIN_LOGIN,
      adminPass: process.env.ADMIN_PASSWORD,
      aad_userName: process.env.AAD_USER_NAME,
      aad_userLogin: process.env.AAD_USER_LOGIN,
      aad_userPass: process.env.AAD_USER_PASSWORD,
      aad_adminName: process.env.AAD_ADMIN_NAME,
      aad_adminLogin: process.env.AAD_ADMIN_LOGIN,
      aad_adminPass: process.env.AAD_ADMIN_PASSWORD,
      userDob: process.env.USER_DOB,
      email: process.env.EMAIL,
      id: process.env.id,
      twSID: process.env.TWILIO_ACCOUNT_SID,
      twToken: process.env.TWILIO_AUTH_TOKEN,
      twPhone: process.env.TWILIO_PHONE_NUMBER,
    },
    //testIsolation: false,
  },   
});