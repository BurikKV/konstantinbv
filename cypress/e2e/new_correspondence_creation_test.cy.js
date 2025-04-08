//In this test, we create a piece of 'correspondence'—essentially a record of communication with the 
// client—using random data (reason, date, and other fields) to mimic a real-world scenario. 
// Then we verify that this newly created correspondence appears in the system with the expected parameters. 
// This demonstrates how to generate dynamic test data, store it in fixtures, and handle iframes in Cypress tests


import { faker } from '@faker-js/faker'; // Import faker for generating random data
const moment = require('moment'); //  Import moment for date/time manipulations

describe('Correspondence tab checking', () => {
  // These variables will store data from fixtures
  let valueMap; 
  let rvsValueMap;

  // Generate a random comment (10 to 30 words)
  const comment = faker.word.words({ count: { min: 10, max: 30 } });

  // Format dates in different required formats
  const currentDate  = moment().format('DD-MMM-YYYY');
  const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
  const formattedyesterday = moment().subtract(1, 'days').format('DD-MMM-YYYY');
  const formattedtoday = moment().format('DD-MMM-YYYY');

  before (() => {
    // Load a map from a fixture file and create a reverse map
    cy.fixture('corsValueMap').then(map => {
      valueMap = map;
      rvsValueMap = Object.fromEntries(Object.entries(map).map(([key, value]) => [value, key]));
    });
  }); 

  beforeEach(() => {
      // Log in before each test using environment variables
      cy.login(Cypress.env('urlSite'), Cypress.env('adminLogin'), Cypress.env('adminPassword'))
  });  

  it('Open just new created client and create new correspondence and check that it was created succesfully', () => {
    // Load client data from a fixture and use it to find the client
    cy.fixture('clientData').then(clientData => {
      cy.get('#SEARCH_REG_NUMBER').type(clientData.regNum);
      cy.get('#SEARCH_SUBMIT_BTN').click();
      cy.get(`#SEARCH_RESULT_TABLE_ROW_${clientData.regNum}`).click();
    
      cy.contains('button', 'Correspondence').click(); // Open the "Correspondence" tab
      cy.wait(5000)

       // Adjust rows per page if the dropdown exists in order to always see the created correspondence
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

      // Switch to the iframe context to create new correspondence
      cy.get(`iframe[src*="${Cypress.env('urlCorr')}"]`).its('0.contentDocument.body').should('not.be.empty')
      .then(cy.wrap).within(() => {
        cy.get('#NEW_CORRES_BTN').click();
        cy.get('#REG_NUMBER_NEW_CORRES').should('have.attr', 'readonly')
        cy.get('#REG_NUMBER_NEW_CORRES').should('have.value', clientData.regNum)
        cy.listbox('#CCORR_MEDIUM', 'corr_media')
        cy.listbox('#CCORR_REASON', 'corr_reason')
        cy.listbox('#CCORR_ACTION', 'corr_action')
        cy.get('#NEW_CORRES_CCORR_DATE').type(yesterday)
        cy.fixture('corsValues').then((corsValues) => { // Save the randomly generated comment to a fixture
          corsValues.comment = comment;
          cy.writeFile('cypress/fixtures/corsValues.json', corsValues);
        });

        cy.get('#NEW_CORRES_CCORR_COMMENTS').type(comment);

        cy.get('#NEW_CORRES_SUBMIT_BTN').click();
        cy.wait(1000)

        // Validate that the newly created correspondence appears in the table with the previously saved data
        cy.fixture('corsValues').then(corsValues => {
          cy.fixture('corsValueMap').then(corsValueMap => {
            const corsMedia = corsValueMap[corsValues.corr_media];
            const corsAction = corsValueMap[corsValues.corr_action];
            cy.get('tr').filter(`:contains(${corsMedia})`).filter(`:contains(${corsValues.corr_reason})`).filter(`:contains(${corsAction})`).first().within(() => {
              cy.get('button[aria-label="expand row"]').click();
              cy.contains('td', formattedyesterday).should('be.visible');
              cy.contains('td', formattedtoday).should('be.visible');
            });
            corsValues.comment = comment;
            cy.contains('textarea', comment).should('be.visible');
          });
        });
        
      });
    });
  });

});


