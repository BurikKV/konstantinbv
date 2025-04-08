// Test suite for generating all different types of letters in all languages,
// then verifying their content and adding them to the correspondence list.

// Import moment for date/time formatting
const moment = require('moment');
// Import helper to clear downloads folder before all tests
const { deleteDownloadsFolderBeforeAll } = require('cypress-delete-downloads-folder');

// Format dates in different required formats
const currentDate  = moment().format('DD-MMM-YYYY');
const formattedDate = moment().format('MMMM Do YYYY');

// Define various letters and their supported languages
const letterTypes = [
  { name: 'Acknowledgement Letter',
    languages: ['English', 'Polish'] },
  { name: 'Approval Letter',
    languages: ['English', 'Polish', 'Russian'] },
  { name: 'Paper Proof of Life',
    languages: ['English', 'Polish', 'Russian', 'French', 'German', 'Hungarian', 'Lithuanian', 'Romanian', 'Slovak' ] },
];

// Define the word "Claim" in different languages
const claimWords = {
  English: 'Claim',
  Polish: 'Z poważaniem',
  Russian: 'С уважением',
  French: 'Dossier',
  German: 'Antrag',
  Hungarian: 'kérvény',
  Lithuanian: 'Pretenzija',
  Romanian: 'A dumneavoastră',
  Slovak: 'Žiadosť',
};

// Helper function for verifying dropdown options
const verifyDropdownOptions = (dropdownId, expectedOptions) => {
  cy.get(dropdownId).click().then(() => {
    cy.get('.MuiList-root[role="listbox"] li[role="option"]').then(($options) => {
      const actualOptions = $options.toArray().map(option => option.innerText.trim());
      const actualOptionsStr = actualOptions.join(', ');
      const expectedOptionsStr = expectedOptions.join(', ');
      cy.log('Actual options:', actualOptionsStr);
      cy.log('Expected options:', expectedOptionsStr);
      expect(actualOptions).to.have.members(expectedOptions);
    });
  });
};

describe('Correspondence tab gen. letter chekings', () => {
  // Remove downloads folder before running all tests
  deleteDownloadsFolderBeforeAll()
  
  // These variables will store data from fixtures
  let valueMap;
  let rvsValueMap;

  before (() => {
    // Load correspondence-related mappings from a fixture
    // and create a reverse map to fetch keys from values.
    cy.fixture('corsValueMap').then(map => {
      valueMap = map;
      rvsValueMap = Object.fromEntries(Object.entries(map).map(([key, value]) => [value, key]));
    });
  }); 

  beforeEach(() => {
      cy.login(Cypress.env('urlSite'), Cypress.env('adminLogin'), Cypress.env('adminPassword'))
  });  

  // Iterate over each letter type to test them all
  letterTypes.forEach((letter) => {
    // Iterate over the supported languages to test them all.
    letter.languages.forEach((language) => {
      it(`Generate ${letter.name} in ${language} language and verify it's content`, () => {
        // Read test data for the client
        cy.readFile('cypress/fixtures/clientData.json').then((clientData) => {
          cy.readFile('cypress/fixtures/newClientData.json').then((newClientData) => {
           
            // Search for client and navigate to their record
            cy.get('#SEARCH_REG_NUMBER').type(clientData.regNum);
            cy.get('#SEARCH_SUBMIT_BTN').click();
            cy.get(`#SEARCH_RESULT_TABLE_ROW_${clientData.regNum}`).click();
            
            // Go to "Correspondence" section
            cy.contains('button', 'Correspondence').click();
            cy.wait(8000)

            // Increase rows per page if dropdown exists
            cy.get(`iframe[src*="${Cypress.env('urlCorr')}"]`).then($iframe => {
              const doc = Cypress.$($iframe.contents());
              const $combobox = doc.find('#TABLE_ROWS_PER_PAGE');
              if ($combobox.length) {
                cy.wrap($combobox).first().click();
                cy.wrap(doc).find('li[data-value="100"]').click();
              } else {
                cy.log('Dropdown not found');
              }
            });
            
            // Switch to the correspondence iframe
            cy.get(`iframe[src*="${Cypress.env('urlCorr')}"]`).its('0.contentDocument.body').should('not.be.empty')
            .then(cy.wrap).within(() => {
              cy.get('#GENERATE_LETTER_BTN').click();

              // Verify read-only fields
              cy.get('#CLIENT_ID_GENERATE_LETTER').should('have.attr', 'readonly')
              cy.get('#CLIENT_ID_GENERATE_LETTER').should('have.value', clientData.regNum);
              cy.get('#NEW_LETTER_CLIENT_FULL_NAME').should('have.attr', 'readonly')
              cy.get('#NEW_LETTER_CLIENT_FULL_NAME').should('have.value', `${newClientData.fname} TestLastName`);

              // Select the document type and letter type
              cy.get('#DOCUMENT_TYPE').click();
              cy.get('ul[role="listbox"] li').should('have.length', 1).and('contain', 'General');
              cy.get('ul[role="listbox"] li').click();

              // Verify letter dropdown options and select the current letter
              verifyDropdownOptions('#LETTER_DESCRIPTION', letterTypes.map(l => l.name));
              cy.contains('li', letter.name).click();
              
              // Verify language dropdown options and select the current language
              verifyDropdownOptions('#LANGUAGE', letter.languages);
              cy.contains('li', language).click();
              cy.get('#GENERATE_LETTER_SUBMIT_BTN').click()

              // Wait for file generation, then download and verify .docx content
              cy.wait(5000);
              cy.task('getLastDownloadedFile').then((filePath) => {
                expect(filePath).to.be.a('string');
                expect(filePath).to.include(letter.name);
                expect(filePath).to.match(/\.docx$/);
                cy.task('readDocx', { filePath }).then((docxContent) => {
                  cy.log("docx Content: " + docxContent)
                  expect(docxContent).to.contain(`${newClientData.fname} TestLastName`);
                  expect(docxContent).to.contain(newClientData.address);
                  expect(docxContent).to.contain(newClientData.city);
                  expect(docxContent).to.contain(newClientData.zip);
                  expect(docxContent).to.contain(formattedDate);
                  // Check if the localized "Claim" word is present
                  const claimWord = claimWords[language];
                  expect(docxContent).to.contain(claimWord);
                });
              });

              // Confirm the creation of correspondence after generating letter
              cy.contains('button', 'Yes').click();
              cy.get('#CLIENT_ID_GENERATE_LETTER').should('have.attr', 'readonly')
              cy.get('#CLIENT_ID_GENERATE_LETTER').should('have.value', clientData.regNum)
              cy.get('#NEW_LETTER_CLIENT_FULL_NAME').should('have.attr', 'readonly')
              cy.get('#NEW_LETTER_CLIENT_FULL_NAME').should('have.value', `${newClientData.fname} TestLastName`)
              cy.get('#DOCUMENT_TYPE').should('have.attr', 'aria-disabled', 'true')
              cy.get('#DOCUMENT_TYPE').should('contain', 'General')
              cy.get('#LETTER_DESCRIPTION').should('have.attr', 'aria-disabled', 'true')
              cy.get('#LETTER_DESCRIPTION').should('contain', letter.name)
              cy.get('#LANGUAGE').should('have.attr', 'aria-disabled', 'true')
              cy.get('#LANGUAGE').should('contain',  language)
              // Add more text to the comment field, then finalize
              cy.get('#CCORR_COMMENTS').should('have.value', 'Letter generated and sent');
              cy.get('#CCORR_COMMENTS').type(' Test text');
              cy.get('#CREATE_CORRES_AFTER_GENERATE_LETTER_SUBMIT_BTN').click();
      
              cy.wait(1000)
              // Expand the row to check that letter creation is recorded
              cy.get(`tr:contains(LETTER):contains(${letter.name}):contains(SENT):contains(${currentDate})`)
              .first()
              .find('button[aria-label="expand row"]')
              .click();
              cy.contains('td', Cypress.env('adminName')).should('be.visible');
              cy.contains('textarea', 'Letter generated and sent Test text').should('be.visible');
            });
          });
        });
      });

    });
  });
      
});


