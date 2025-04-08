// This test suite checks various date-related validations while editing
// an existing client. It ensures that future/past date limits,
// client age, and application dates are properly enforced.


//  Import moment for date/time manipulat
const moment = require('moment'); 

// Format dates in different required formats
const futureDate = moment().add(Math.floor(Math.random() * moment().add(115, 'years').diff(moment(), 'days')), 'days').format('YYYY-MM-DD');
const pastDate = moment().subtract(115, 'years').subtract(Math.floor(Math.random() * moment().subtract(115, 'years').diff(moment().subtract(230, 'years'), 'days')), 'days').format('YYYY-MM-DD');
const normalDate = moment().subtract(Math.floor(Math.random() * moment().diff(moment().subtract(115, 'years'), 'days')), 'days').format('YYYY-MM-DD');
const cDate = moment().subtract(115, 'years').format('YYYY-MM-DD');
const oldDateText = moment().subtract(115, 'years').format('DD/MM/YYYY');
const today = moment().format('YYYY-MM-DD');
const todayText = moment().format('DD/MM/YYYY');

describe('Edit new  created client', () => {

  beforeEach(() => {
      cy.login(Cypress.env('urlSite'), Cypress.env('adminLogin'), Cypress.env('adminPassword'))
  });  

  it(`Open just new created client and check that error appers & data don't save after cancel`, () => {
    // Retrieve the newly created client's registration number from the fixture
    cy.readFile('cypress/fixtures/clientData.json').then(clientData => {
      cy.get('#SEARCH_REG_NUMBER').type(clientData.regNum);
      cy.get('#SEARCH_SUBMIT_BTN').click();
      cy.get(`#SEARCH_RESULT_TABLE_ROW_${clientData.regNum}`).click();
    });
  
    cy.get('#Client_START_EDITING_BTN').click();

    // Test future birth date validation
    cy.get('#CLIENT_BIRTH_DATE').clear().type(futureDate);
    cy.get('#Client_SAVE_EDITING_BTN').click();
    cy.get('#CLIENT_BIRTH_DATE').then(($input) => {
      const validationMessage = $input[0].validationMessage;
      expect(validationMessage).to.include(`Value must be ${todayText} or earlier`);
    });

    // Test overly old birth date validation
    cy.get('#CLIENT_BIRTH_DATE').clear().type(pastDate);
    cy.get('#Client_SAVE_EDITING_BTN').click();
    cy.get('#CLIENT_BIRTH_DATE-helper-text').should('have.text', "The age of a client can't be more than 115 years");
    
    cy.get('#CLIENT_BIRTH_DATE').clear().type(cDate);
    cy.get('#CLIENT_DECEASED_DATE').clear().type(pastDate);
    cy.get('#Client_SAVE_EDITING_BTN').click();
    cy.get('#CLIENT_DECEASED_DATE').then(($input) => {
      const validationMessage = $input[0].validationMessage;
      expect(validationMessage).to.include(`Value must be ${oldDateText} or later`);
    });

    // Test future deceased date validation
    cy.get('#CLIENT_DECEASED_DATE').clear().type(futureDate);
    cy.get('#Client_SAVE_EDITING_BTN').click();
    cy.get('#CLIENT_DECEASED_DATE').then(($input) => {
      const validationMessage = $input[0].validationMessage;
      expect(validationMessage).to.include(`Value must be ${todayText} or earlier`);
    });

    // Test birth date is in future
    cy.get('#CLIENT_BIRTH_DATE').clear().type(futureDate);
    cy.get('#CLIENT_BIRTH_DATE-helper-text').should('have.text', "Cant be bigger than today");
    
    // Set valid birth date but invalid deceased date (less than birth date)
    cy.get('#CLIENT_BIRTH_DATE').clear().type(today);
    cy.get('#CLIENT_DECEASED_DATE').clear().type(normalDate);
    cy.get('#Client_SAVE_EDITING_BTN').click();
    cy.get('#CLIENT_DECEASED_DATE-helper-text').should('have.text', "Death Date cannot be less then Birth Date*");
    
    // Test application received date older than 115 years
    cy.get('#CLIENT_APP_RECEIVED_DATE').clear().type(pastDate);
    cy.get('#CLIENT_APP_RECEIVED_DATE-helper-text').should('have.text', "App Received Date cannot be later than 115 years from today");
    // Test application received date in the future
    cy.get('#CLIENT_APP_RECEIVED_DATE').clear().type(futureDate);
    cy.get('#Client_SAVE_EDITING_BTN').click();
    cy.get('#CLIENT_APP_RECEIVED_DATE').then(($input) => {
      const validationMessage = $input[0].validationMessage;
      expect(validationMessage).to.include(`Value must be ${todayText} or earlier`);
    });

    // Clear deceased date; set normal birth date and today's application date
    cy.get('#CLIENT_BIRTH_DATE').clear().type(normalDate);
    cy.get('#CLIENT_DECEASED_DATE').clear()
    cy.get('#CLIENT_APP_RECEIVED_DATE').clear().type(today);

    // Test stop code "From/To" dates
    cy.get('#CLIENT_CLAIM_ERROR_CODE_FROM').clear().type(futureDate);
    cy.get('#CLIENT_CLAIM_ERROR_CODE_TO').clear().type(normalDate);
    cy.get('#CLIENT_CLAIM_ERROR_CODE_FROM-helper-text').should('have.text', `Stop code "From" cannot be more then Stop code "To"`);

    // Leave editing mode, choose to discard changes
    cy.get('#NAVBAR_BTN').click()
    cy.contains('.MuiAlert-message', 'Client info under editing. Save or Discard.').should('be.visible');

    cy.get('#Client_CLOSE_EDITING_BTN').click();
    cy.on('window:confirm', (text) => {
      expect(text).to.equal('Would you like to discard Client changes?');
      return true;
    });

    // Try adding a new client with an invalid date, confirm validations
    cy.get('#NAVBAR_BTN_NEW_CLIENT').click()
    cy.get('div [role="dialog"]').as('clientpopup');

    // Test birth date in the distant past
    cy.get('@clientpopup').find('#ADD_CLIENT_BIRTH_DATE').type(pastDate)
    cy.get('@clientpopup').find('#NEW_CLIENT_SUBMIT_BTN').click()
    cy.get('@clientpopup').find('#ADD_CLIENT_BIRTH_DATE').then(($input) => {
      const validationMessage = $input[0].validationMessage;
      expect(validationMessage).to.include(`Value must be ${oldDateText} or later`);
    });

    // Test birth date in the future
    cy.get('@clientpopup').find('#ADD_CLIENT_BIRTH_DATE').type(futureDate)
    cy.get('@clientpopup').find('#NEW_CLIENT_SUBMIT_BTN').click()
    cy.get('@clientpopup').find('#ADD_CLIENT_BIRTH_DATE').then(($input) => {
      const validationMessage = $input[0].validationMessage;
      expect(validationMessage).to.include(`Value must be ${todayText} or earlier`);
    });      
    
    // Test app received date too far in the past
    cy.get('@clientpopup').find('#ADD_CLIENT_BIRTH_DATE').type(normalDate)
    cy.get('@clientpopup').find('#ADD_CLIENT_APP_RECEIVED_DATE').type(pastDate)
    cy.get('@clientpopup').find('#NEW_CLIENT_SUBMIT_BTN').click()
    cy.get('@clientpopup').find('#ADD_CLIENT_APP_RECEIVED_DATE').then(($input) => {
      const validationMessage = $input[0].validationMessage;
      expect(validationMessage).to.include(`Value must be ${oldDateText} or later`);
    });

    // Test app received date in the future
    cy.get('@clientpopup').find('#ADD_CLIENT_APP_RECEIVED_DATE').type(futureDate)
    cy.get('@clientpopup').find('#NEW_CLIENT_SUBMIT_BTN').click()
    cy.get('@clientpopup').find('#ADD_CLIENT_APP_RECEIVED_DATE').then(($input) => {
      const validationMessage = $input[0].validationMessage;
      expect(validationMessage).to.include(`Value must be ${todayText} or earlier`);
    }); 
    
  });
});


