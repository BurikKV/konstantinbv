# About
This is an instruction for common steps to setup and run tests in this repository. 

## Working with Photo files
Install FFmpeg to convert files to y4m: https://video.stackexchange.com/questions/20495/how-do-i-set-up-and-use-ffmpeg-in-windows
ffmpeg -i input.mp4 -pix_fmt yuv420p output.y4m
ffmpeg -loop 1 -i inputImage.png -pix_fmt yuv420p -t 0.05 outputVideo.y4m 
ffmpeg -loop 1 -i doc.jpg -pix_fmt yuv420p -t 0.05 doc.y4m 
ffmpeg -loop 1 -i photo.jpg -pix_fmt yuv420p -t 0.05 photo.y4m 

# Running tests

## Global Prerequisits (Windows)
1. [Install and setup Ubuntu with WSL2](https://dev.to/adityakanekar/upgrading-from-wsl1-to-wsl2-1fl9)
2. [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
3. [Install Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/installing-git-large-file-storage?platform=windows) (to work with binary files)
3. Clone this repository with tests


## Run tests using Docker
Install [Global Prerequisits](#global-prerequisits) first.

### Docker Prerequisits
4. [Install Docker](https://docs.docker.com/engine/install/)
5. Clone [cypress/included](https://hub.docker.com/r/cypress/included) docker image

### Run tests in Docker
6. Execute: ```docker run -v C:\Users\Tests:/e2e -w /e2e cypress/included``` where ```C:\Users\Tests\``` is a full path to a ```Tests``` folder in a clonned repository from step 3.


## Run tests using local installation
Install [Global Prerequisits](#global-prerequisits) first.

### Local Installation Prerequisits
Switch to project folder and run:
```
bash install_dependencies.sh
```

### Run tests locally
Execute: ```npx cypress run``` or (for interactive mode): ```npx cypress open```

### Plugins for VS Code
Install plugins for VS Code (optionally):
+ [Cypress Helper](https://marketplace.visualstudio.com/items?itemName=shevtsov.vscode-cy-helper)
+ [GitHub Actions](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-github-actions)
+ [NPM Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.npm-intellisense)
+ [Code Runner](https://marketplace.visualstudio.com/items?itemName=formulahendry.code-runner)


## Reporting
I use [Allure Cypress](https://allurereport.org/docs/cypress/) for reporting.

### Reporting Prerequisits
+ Make sure JDK is installed:
```
java -version
```
If not, install JDK for example from here: https://adoptium.net/temurin/releases/?os=windows&arch=x86&package=jdk&version=8 

+ Install (if you didn't install it through install_dependencies.sh) the Allure Cypress adapter and Allure Report command-line tool:
```
npm install --save-dev allure-commandline
npm install --save-dev allure-cypress
```
+ Add to `cypress.config.json`:
```
const { defineConfig } = require("cypress");
const { allureCypress } = require("allure-cypress/reporter");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      allureCypress(on);
    },
  },
});
```
+ Add to support/e2e.js file:
```
import 'allure-cypress';
```

### Watch report in Allure
1. Run tests locally:
```
npx cypress run
```
2. Open Allure report:
```
npx allure serve allure-results
```

### Watch Execution history in Allure
1. Execute: ```allure generate allure-results --clean -o allure-report```
2. Execute:
```
mkdir -p allure-results/history
cp -r allure-report/history/* allure-results/history/
```
3. To open reports execute:
+ `npx allure serve allure-report` directory contains just the last run
+ `npx allure serve allure-results` directory contains the history (which you want)

You need to execute at least 2 runs for the history to "start working".
