// This test suite creates a new client with randomly generated data,
// and then verifies that the client is properly added and can be found.

// Import faker for generating random data
import { faker } from '@faker-js/faker';
// Import chance for generating random values
import Chance from 'chance';
const chance = new Chance();
// Import moment for date/time modifications
const moment = require('moment');

describe('Add new client', () => {
    before (() => {
      // Generate random data for the new client
      const fname = faker.person.firstName();
      const lname = chance.last({ nationality: 'en' })
      const address = faker.location.streetAddress();
      const city = faker.location.city();
      const zip = faker.location.zipCode();
      const bDate = moment().subtract(Math.floor(Math.random() * moment().diff(moment().subtract(115, 'years'), 'days')), 'days').format('YYYY-MM-DD');
      const appRDate = moment().subtract(Math.floor(Math.random() * moment().diff(moment().subtract(115, 'years'), 'days')), 'days').format('YYYY-MM-DD');
      const clientData = { fname, lname, address, city, zip, bDate, appRDate };
      cy.writeFile('cypress/fixtures/clientData.json', clientData);
    }); 
    beforeEach(() => {
      cy.login(Cypress.env('urlSite'), Cypress.env('userLogin'), Cypress.env('userPass'))
    });  

    it('Adding new client with full information', () => {
    cy.fixture('clientData').then(clientData => {  
      const { fname, lname, address, city, zip, bDate, appRDate } = clientData;
      cy.get('#NAVBAR_BTN_NEW_CLIENT').click() // Click "Add New Client" to open the form
      cy.get('div [role="dialog"]').as('clientpopup'); //find pop up window and call it clientpopup

      cy.get('@clientpopup').find('#ADD_CLIENT_FIRST_NAME').type(fname)
      cy.get('@clientpopup').find('#ADD_CLIENT_LAST_NAME').type(lname)    
      cy.get('@clientpopup').find('#ADD_CLIENT_ADDRESS').type(address)   
      
      // Select a random country
      cy.get('@clientpopup').find('#COUNTRY_CODE').click()
      cy.get('.MuiMenu-list li[role="option"]').then($options => {
        const itemCount = $options.length;
        const randomIndex = Math.floor(Math.random() * itemCount);
        const country = $options.eq(randomIndex).text();
        clientData.country = country; // Save selected country
        cy.wrap($options).eq(randomIndex).click();
      });

      // Some countries have a state dropdown, some do not
      cy.get('@clientpopup').find('#STATE_CODE').then($dropdown => {
        if (!$dropdown.hasClass('Mui-disabled')) {
          // If the dropdown is not disabled, click it to open
          cy.wrap($dropdown).click();
          cy.get('.MuiMenu-list li[role="option"]').then($options => {
            const itemCount = $options.length;
            const randomIndex = Math.floor(Math.random() * itemCount);
            const state = $options.eq(randomIndex).text();
            clientData.state = state; // Save selected state
            cy.wrap($options).eq(randomIndex).click();
          });
        } else {
          clientData.state = "\u200B";
          cy.log('Dropdown is disabled and cannot be interacted with.');
        }
      });

      cy.get('@clientpopup').find('#ADD_CLIENT_CITY').type(city)
      cy.get('@clientpopup').find('#ADD_CLIENT_ZIP').type(zip)
      // Select a random gender
      cy.get('@clientpopup').find('#GENDER').click()
      cy.get('.MuiMenu-list li[role="option"]').then($options => {
        const itemCount = $options.length;
        const randomIndex = Math.floor(Math.random() * itemCount);
        const gender = $options.eq(randomIndex).text();
        clientData.gender = gender; // Save selected gender
        cy.wrap($options).eq(randomIndex).click();
      });
      
      // Enter birth date and application received date
      cy.get('@clientpopup').find('#ADD_CLIENT_BIRTH_DATE').type(bDate) //should be exact format for date 'type'
      cy.get('@clientpopup').find('#ADD_CLIENT_APP_RECEIVED_DATE').type(appRDate) //should be exact format for date 'type'
      cy.get('@clientpopup').find('#NEW_CLIENT_SUBMIT_BTN').click() // press Add New
     
      // Confirm the new client has been added and capture the registration number
      cy.contains('.MuiAlert-message', 'New client has been added. Reg.Number:').invoke('text').then((text) => {
        const regN = text.match(/Reg\.Number: (\d+)/)[1];
        cy.log('Registration Number:', regN);
        clientData.regNum = regN;
        cy.writeFile('cypress/fixtures/clientData.json', clientData);
      });
    });
  });

  it('Verify that the client is created and can be found', () => {
    cy.get('#NAVBAR_BTN').click()
    cy.readFile('cypress/fixtures/clientData.json').then(clientData => {
      const { fname, lname, address, city, state, zip, bDate, appRDate, country, gender, regNum } = clientData;
       // Search for the newly added client
      cy.get('#SEARCH_REG_NUMBER').type(regNum);
      cy.get('#SEARCH_FIRST_NAME').type(fname);
      cy.get('#SEARCH_LAST_NAME').type(lname);

      cy.get('#SEARCH_SUBMIT_BTN').click();

      cy.get(`#SEARCH_RESULT_TABLE_ROW_${regNum}`).click();

      // Confirm that the client's details are correct
      cy.CheckClientsValues(regNum, fname, lname, gender, address, city, state, zip, country, bDate, appRDate);

      cy.get('#CLAIM_ERROR_CODE').should('have.value', '');
      cy.get('#CLIENT_CLAIM_ERROR_CODE_FROM').should('have.value', '');
      cy.get('#CLIENT_CLAIM_ERROR_CODE_TO').should('have.value', '');
      cy.get('#CLIENT_CLAIM_FINANCIAL_COMMENTS').should('have.value', '');

      // Check that the registration number and name fields match
      cy.get('#CLIENT_CARD_REG_NUMBER').should('have.value', regNum)
      cy.get('#CLIENT_CARD_FULL_NAME').should('have.value', `${lname} ${fname}`);
      cy.get('#CLIENT_CARD_STATUS').should('have.value', 'New Entry')

    });
  });
});


