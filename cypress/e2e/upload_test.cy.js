// This test demonstrates how to upload multiple files (e.g., .jpg, .pdf, .png, .tiff), 
// then verify they appear in the system with the correct type, date, and status.


// for production testing we MUST change const regNum!!!
const moment = require('moment'); //  Import moment for date/time manipulations
const today = moment().format('YYYY-MM-DD'); // Store today's date in YYYY-MM-DD format

describe('Add Document tab checkings - Upload', () => {

  beforeEach(() => {
      cy.login(Cypress.env('urlSite'), Cypress.env('adminLogin'), Cypress.env('adminPassword'))
  });  

  it(`Check Add document tab, upload 5 files and check them`, () => {
    // Fetch client data from fixtures to locate the correct client
    cy.fixture('clientData').then(clientData => {
      cy.get('#SEARCH_REG_NUMBER').type(clientData.regNum);
      cy.get('#SEARCH_SUBMIT_BTN').click();
      cy.get(`#SEARCH_RESULT_TABLE_ROW_${clientData.regNum}`).click();

      // Wait for any progress bar to disappear, then confirm regNum
      cy.get('span[role="progressbar"]', {timeout:10000}).should('not.be.visible');
      cy.get('#CLIENT_CARD_REG_NUMBER').should('have.value', clientData.regNum)
    });
    
    // Click on the "Add Document" button to open the upload flow
    cy.contains('button', 'Add Document').click();
    cy.wait(5000)

    // Switch to iframe context for file uploads
    cy.get(`iframe[src*="${Cypress.env('urlScan')}"]`).its('0.contentDocument.body').should('not.be.empty')
    .then(cy.wrap).within(() => {
      // Drag and drop multiple files (JPG, PDF, PNG, TIFF)
      cy.get('#DRAG_DROP_COMP_TOGGLE_BUTTON').click();
      cy.get('#DROP_FILES_HERE_BOX').selectFile([
        'cypress/fixtures/pic/test_pic_jpg.jpg',
        'cypress/fixtures/pic/test_pic_pdf.pdf',
        'cypress/fixtures/pic/test_pic_png.png',
        'cypress/fixtures/pic/test_pic_tiff.tiff',
      ], { action: 'drag-drop' });
  
      // Upload file through SelectFile button
      cy.get('input[type="file"]').selectFile('cypress/fixtures/pic/test_pic_jpg.jpg', { force: true });
      
      // Confirm that 5 files are recognized
      cy.get('tr').filter(':has(p#DRAG_DROP_FILE_NUMBER:contains("5"))').should('be.visible')
      
      // Choose a random file type from the dropdown for the first file
      cy.get('tr').filter(':has(p#DRAG_DROP_FILE_NUMBER:contains("1"))').within(() => {
        cy.get('#DRAG_DROP_SELECT_FILE_TYPE').click();
      });

      // Randomly pick one option from the list, click it, and store the selected text in an alias
      cy.get('ul[role="listbox"] li').then(($options) => {
        const itemCount = $options.length;
        const randomIndex = Math.floor(Math.random() * itemCount);
        const selectedValue = Cypress.$($options[randomIndex]).text().trim();
        cy.wrap($options).eq(randomIndex).click();
        cy.wrap(selectedValue).as('slctUpValue');
      });

      // Verify that the selected file type is displayed
      cy.get('@slctUpValue').then((selectedValue) => {
        cy.get('tr').filter(':has(p#DRAG_DROP_FILE_NUMBER:contains("1"))').within(() => {
          cy.get('#DRAG_DROP_SELECT_FILE_TYPE').should('contain.text', selectedValue);
        });
      });
       // Save/upload the documents
        cy.get('span[aria-label="Save"]').find('button').click();
        cy.contains('.MuiAlert-message', "File(s) uploaded successfully").should('exist');
        cy.get('span[role="progressbar"]', {timeout:15000}).should('not.be.visible');
    });

    // Check that the uploaded files appear with the correct type and today's date
    cy.get('@slctUpValue').then((selectedValue) => {
      cy.get('#CLIENT_PAGE_DOCUMENT_BOX').within(() => {
        cy.contains('tr', '001').should('contain.text', selectedValue).and('contain.text', today);
        cy.contains('tr', '005').should('contain.text', 'Other - Supplemental Information').and('contain.text', today);
      });
    });
  
  });
});



