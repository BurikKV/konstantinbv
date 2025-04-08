// This test suite checks the Payment tab, ensuring that printable data
// is displayed correctly and exported Excel files contain the expected details.

//  Import moment for date/time manipulat
const moment = require('moment'); ions
// Import helper to clear downloads folder before all tests
const { deleteDownloadsFolderBeforeAll } = require('cypress-delete-downloads-folder');

// Format current date in DD-MMM-YYYY format
const currentDate = moment().format('DD-MMM-YYYY');

describe('Payment tab chekings', () => {
  deleteDownloadsFolderBeforeAll()

  beforeEach(() => {
      cy.login(Cypress.env('urlSite'), Cypress.env('adminLogin'), Cypress.env('adminPassword'))
  });  

  it(`Check Payment tab, download excel files and verify it's content`, () => {
    // Search for a specific client by Reg Number
    cy.get('#SEARCH_REG_NUMBER').type('3000002');
    cy.get('#SEARCH_SUBMIT_BTN').click();
    cy.get(`#SEARCH_RESULT_TABLE_ROW_3000002`).click();

    cy.get('button[role="tab"]').contains(/^Payment$/).click();

    //Approvals Archive checking
    cy.contains('h5', 'Approvals Archive').closest('.css-o4tnx').within(() => {
      cy.get('button[aria-label="print"]').first().click();
    });

    cy.contains('.MuiDialogContent-root', 'Approvals Archive').within(() => {
      cy.contains('h5', '3000002').should('be.visible');
      cy.contains('button', 'Print').should('be.visible');
      cy.contains(currentDate).should('be.visible');
      cy.contains(`${moment().format('h:mm A')}`).should('be.visible');
      cy.contains('Claims Conference').should('be.visible');
      cy.get(`tr:contains(Year):contains(Quarter):contains(Claimant Amount)`).should('be.visible')
      cy.get(`tr:contains(2022):contains(1):contains(1,880.00)`).should('be.visible')
      cy.contains('p', 'Total Amount').should('be.visible');
    });
    cy.contains('button', 'Close').click();

    cy.contains('h5', 'Approvals Archive').closest('.css-o4tnx').within(() => {
      cy.get('button[aria-label="export"]').first().click();
    });

    // Check the exported Approvals Archive Excel file
    cy.checkExcel('Approvals Archive', (data) => {
      const entry = data.Sheet1.find((item) => item["Pa Id"] === 1172);
      expect(entry).to.not.be.undefined;
      expect(entry).to.have.property('Reg Number', 3000002);
      expect(entry).to.have.property('Pa Year Of Pay', 2022);
      expect(entry).to.have.property('Pa Quarter Of Pay', 1);
      expect(entry).to.have.property('Group Id', '2022_1Q');
      expect(entry).to.have.property('Pa Amount', 1880);
      expect(entry).to.have.property('Pa Userid', 'System');
    }, '3000002');
 
    //Payments Archive checking
    cy.contains('h5', 'Payments').closest('.css-o4tnx').within(() => {
      cy.get('button[aria-label="print"]').first().click();
    });

    cy.contains('.MuiDialogContent-root', 'Payments Archive').within(() => {
      cy.contains('h5', '3000002').should('be.visible');
      cy.contains('button', 'Print').should('be.visible');
      cy.contains(currentDate).should('be.visible');
      cy.contains(`${moment().format('h:mm A')}`).should('be.visible');
      cy.contains('Claims Conference').should('be.visible');
      cy.get(`tr:contains(Year):contains(Month):contains(Claimant Amount)`).should('be.visible')
      cy.contains('p', 'Total Amount').should('be.visible');
      cy.get(`tr:contains(2022):contains(1):contains(1,880.00)`).within(() => {
        cy.get('button[aria-label="expand row"]').click();
      });
      
      // Verify the additional information is displayed after clicking the expand button
      cy.contains('JSS Tran. Ref:').should('be.visible');
      cy.contains('RGF03000002W0008').should('be.visible');
      cy.contains('7669088').should('be.visible');
      cy.contains('G1413635647701').should('be.visible');
      cy.contains('1,880.00 EUR').should('be.visible');
      cy.contains('2022-01-03').should('be.visible');
      cy.contains('2022_1Q').should('be.visible');
  

    });
    cy.contains('button', 'Close').click();


    cy.contains('h5', 'Payments Archive').closest('.css-o4tnx').within(() => {
      cy.get('button[aria-label="export"]').first().click();
    });

    // Check the exported Payments Archive Excel file
    cy.checkExcel('Payments Archive', (data) => {
      const entry = data.Sheet1.find((item) => item["Pay Id"] === 7669088);
      expect(entry).to.not.be.undefined;
      expect(entry).to.have.property('Reg Number', 3000002);
      expect(entry).to.have.property('Pay Transaction Reference', 'RGF03000002W0008');
      expect(entry).to.have.property('Pay Bank Reference', 'G1413635647701  ');
      expect(entry).to.have.property('Pay Amount', 1880);
      expect(entry).to.have.property('Pay Status', 'ASSUMED: PAYMENT/TRANSFER TO RECIPIENT');
      expect(entry).to.have.property('Pay Out Medium', 'CITIBANK');
      expect(entry).to.have.property('Pay Source Batch', '2022_1Q');
    }, '3000002');

  });
});



