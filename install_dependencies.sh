#!/bin/bash
echo "====== Installing Core Framework ======" &&
echo "NPM Install" && npm install -g npm &&
echo "Install Cypress" && npm install cypress --save-dev &&
echo "====== Installing Libraries ======" &&
# working with env files
echo "dotenv Install" && npm install dotenv --save &&
# Generating random data
echo "faker Install" && npm install @faker-js/faker --save-dev &&
# working with dates
echo "moment Install" && npm install moment &&
# Re-running Cypress commands
echo "cypress-recurse Install" && npm i -D cypress-recurse &&
# delete downoad folders
echo "cypress-recurse Install" && npm i -D cypress-delete-downloads-folder &&
# working with docfiles
echo "mammoth Install" && npm install mammoth &&
# working with pdf files
echo "pdf-parse installed successfully" && npm install pdf-parse &&
# remove current xlsx package
echo "xlsx Uninstall" && npm rm --save xlsx &&
# working with excel files (For the actual link see https://docs.sheetjs.com/docs/getting-started/installation/nodejs)
echo "New xlsx package Install" && npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz &&
# Parsing email content to HTML
echo "cheerio Install" && npm install cheerio &&
# Gmail tester (https://www.npmjs.com/package/gmail-tester) (init command: node .\init.js credentials.json token.json youremail@mail.com)
echo "gmail-tester Install" && npm install --save-dev gmail-tester &&
# sms sending/receiving
echo "twilio Install" && npm install twilio &&
echo "====== Reporting ======" &&
echo "allure-cypress Install" && npm i --save-dev allure-cypress &&
echo "allure-commandline Install" && npm install -g allure-commandline --save-dev &&
echo "====== Copying Gmail Token Files ======" &&
cp "../common/credentials.json" "./node_modules/gmail-tester" &&
cp "../common/token-store.js" "./node_modules/gmail-tester" &&
cp "../common/token.json" "./node_modules/gmail-tester"