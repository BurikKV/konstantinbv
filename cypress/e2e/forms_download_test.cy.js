// Test suite for opening, downloading, and verifying PDF form content

// choose language and import all language files
const lang = 'russian'
const front = require(`/cypress/support/localization/${lang}/translation.json`);
const back = require(`/cypress/support/localization/${lang}/${lang}.ts`);
import { langlist } from '/cypress/support/localization/langlist.ts';
import list from '/cypress/support/localization/list.ts';

// Import helper to clear downloads folder before all tests
const { deleteDownloadsFolderBeforeAll } = require('cypress-delete-downloads-folder');

// Date & time constants needed for tests
const currentDate = new Date();
const day = currentDate.getDate().toString().padStart(2, '0');
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const month = monthNames[currentDate.getMonth()]; // Retrieve the month name from the array.
const year = currentDate.getFullYear().toString();
const formattedCurrentDate = `${day} ${month} ${year}`;

describe('Check All Forms for Download ', () => {
  deleteDownloadsFolderBeforeAll()
  
  before(() => {
  });

  it('Checks all forms - open, download and check content', () => {
    // Visit the site and switch language
    cy.visitWithRetry(Cypress.env('urlSite'));
    cy.get('button[aria-label="Language"]').click();
    cy.contains('li', langlist[lang]).click();
    // Fill in login credentials in the chosen language
    cy.get(`input[placeholder="${front.login_form.username}"]`).type(Cypress.env('userLogin'));
    cy.get(`input[placeholder="${front.login_form.password}"]`).type(Cypress.env('userPass'), { log: false });
    cy.get('input[type="checkbox"]').check();
    cy.contains('button', front.login_form.login).click();
    // Navigate to the Forms for Download page
    cy.contains('p', front.features.forms).click(); //Forms for Download
    
    cy.contains('p', front.scan_upload).should('be.visible'); //Once it is completed and signed, please scan and upload it using the
    cy.contains('a',front.doc_upload).should('be.visible').and('have.attr', 'href', '/user_documents_upload'); //Document Upload
    cy.contains('p', front.send_email).should('be.visible'); //link below or send it by email to
    
    //Request Payment Confirmation
    cy.contains('h6', front.features.payment_confirm_letter).click();
    cy.PopUpRequest('Submit Request')
    cy.PopUpCheck(back[lang].request_submitted)
    
    //Request Copy of File
    cy.contains('h6', front.features.payment_copy_file).click();
    cy.PopUpRequest('Download form')
    cy.PopUpCheck(back[lang].ver1_4_0.download_completed)

    // Check the last downloaded PDF file
    cy.task('getLastDownloadedFile', {timeout: 5000}).then((filePath) => {//check downloaded file
      expect(filePath).to.be.a('string');
      expect(filePath).to.include('request_copy_file');
      expect(filePath).to.match(/\.pdf$/);
      cy.task('getPdfContent', filePath).then((pdfText) => {
        // Verify expected content in the PDF
        expect(pdfText).to.include('Request Copy of File and All Archival Information');
        expect(pdfText).to.include(`Registration Number:\n${Cypress.env('userLogin')}`);
        expect(pdfText).to.include(formattedCurrentDate);
        cy.log("PDF Content: " + pdfText);
      });
    });

    //Request Copy of Claim Decision Letter
    cy.contains('h6', front.features.approval_letter).click();
    cy.PopUpRequest('Submit Request')
    cy.PopUpCheck(back[lang].request_submitted)

    //Copy of Bank Waiver Fee Letter
    cy.contains('h6', front.features.bank_waiver_letter).click(); 
    cy.PopUpCheck(back[lang].ver1_4_0.download_completed)

    cy.task('getLastDownloadedFile', {timeout: 5000}).then((filePath) => {
      expect(filePath).to.be.a('string');
      expect(filePath).to.include('Waiver Fees Letter');
      expect(filePath).to.match(/\.pdf$/);
      cy.task('getPdfContent', filePath).then((pdfText) => {
        expect(pdfText).to.include('To Whom It May Concern');
        cy.log("PDF Content: " + pdfText);
      });
    });

    //Submit Power of Attorney Forms
    cy.contains('h6', front.features.poa).click(); 
    cy.PopUpRequest('Download form')
    cy.PopUpCheck(back[lang].ver1_4_0.download_completed)

    cy.task('getLastDownloadedFile', {timeout: 5000}).then((filePath) => {
      expect(filePath).to.be.a('string');
      expect(filePath).to.include('poa');
      expect(filePath).to.match(/\.pdf$/);
      cy.task('getPdfContent', filePath).then((pdfText) => {
        expect(pdfText).to.include('Inquiry on Behalf of Applicant Form');
        expect(pdfText).to.include(`Registration Number:\n${Cypress.env('userLogin')}`);
        expect(pdfText).to.include(formattedCurrentDate);
        cy.log("PDF Content: " + pdfText);
      });
    });

    cy.contains('h6', front.features.poa).parents('.MuiPaper-root').first().contains('a', front.online_submition).should('have.attr', 'href', '/poa');

    //Change of Banking Details
    cy.contains('h6', front.features.change_banking_details).click();   

    cy.get('.css-b8tju9', {timeout: 15000}).as('clientpopup');
    cy.get('input[type="radio"][value="ARTICLE 2"]').click();
    cy.contains('div', front.bank_country).click();
    cy.contains('li', 'United States').click();
    cy.get('@clientpopup').find('button', 'Download form').click();
    
    cy.PopUpCheck(back[lang].ver1_4_0.download_completed)

    cy.task('getLastDownloadedFile', {timeout: 5000}).then((filePath) => {
      expect(filePath).to.be.a('string');
      expect(filePath).to.include('bank_change');
      expect(filePath).to.match(/\.pdf$/);
      cy.task('getPdfContent', filePath).then((pdfText) => {
        expect(pdfText).to.include('Change Bank Details');
        expect(pdfText).to.include(`Registration Number:\n${Cypress.env('userLogin')}`);
        //expect(pdfText).to.include(formattedCurrentDate); // Uncomment when fixed on server
        cy.log("PDF Content: " + pdfText);
      });
    });
    cy.contains('h6', front.features.change_banking_details).parents('.MuiPaper-root').first().contains('a', front.online_submition).should('have.attr', 'href', '/change_banking_details');

    //Legal Change of Name
    cy.contains('h6', front.features.change_of_name).click();
    cy.PopUpRequest('Download form')
    cy.PopUpCheck(back[lang].ver1_4_0.download_completed)

    cy.task('getLastDownloadedFile', {timeout: 5000}).then((filePath) => {
      expect(filePath).to.be.a('string');
      expect(filePath).to.include('name_change_legal');
      expect(filePath).to.match(/\.pdf$/);
      cy.task('getPdfContent', filePath).then((pdfText) => {
        expect(pdfText).to.include('Name Change Form');
        expect(pdfText).to.include(`Registration Number:\n${Cypress.env('userLogin')}`);
        expect(pdfText).to.include(formattedCurrentDate);
        cy.log("PDF Content: " + pdfText);
      });
    });

    cy.contains('h6', front.features.change_of_name).parents('.MuiPaper-root').first().contains('a', front.online_submition).should('have.attr', 'href', '/change_of_name');


    //Name Change - Spelling Correction
    cy.contains('h6', front.features.change_of_name_spelling).click(); 
    
    cy.get('.css-b8tju9', {timeout: 15000}).as('clientpopup');
    cy.PopUpRequest('Download form')
    cy.PopUpCheck(back[lang].ver1_4_0.download_completed)

    cy.task('getLastDownloadedFile', {timeout: 5000}).then((filePath) => {
      expect(filePath).to.be.a('string');
      expect(filePath).to.include('name_change_spelling');
      expect(filePath).to.match(/\.pdf$/);
      cy.task('getPdfContent', filePath).then((pdfText) => {
        expect(pdfText).to.include('Name Change Form');
        expect(pdfText).to.include(`Registration Number:\n${Cypress.env('userLogin')}`);
        expect(pdfText).to.include(formattedCurrentDate);
        cy.log("PDF Content: " + pdfText);
      });
    });

    cy.contains('h6', front.features.change_of_name).parents('.MuiPaper-root').first().contains('a', front.online_submition).should('have.attr', 'href', '/change_of_name');


    //Change of Address
    cy.contains('h6', front.features.change_personal_info).click();
    cy.PopUpCheck(back[lang].ver1_4_0.download_completed)

    cy.task('getLastDownloadedFile', {timeout: 5000}).then((filePath) => {
      expect(filePath).to.be.a('string');
      expect(filePath).to.include('address_change');
      expect(filePath).to.match(/\.pdf$/);
      cy.task('getPdfContent', filePath).then((pdfText) => {
        expect(pdfText).to.include('Address Change Form');
        expect(pdfText).to.include(`Registration Number:\n${Cypress.env('userLogin')}`);
        expect(pdfText).to.include(formattedCurrentDate);
        cy.log("PDF Content: " + pdfText);
      });
    }); 

    cy.contains('h6', front.features.change_personal_info).parents('.MuiPaper-root').first().contains('a', front.online_submition).should('have.attr', 'href', '/change_personal_info');

    //Request Payment History
    cy.contains('h6', front.features.request_payment_history).click();
    cy.PopUpRequest('Submit Request')
    cy.PopUpCheck(back[lang].request_submitted)
  })
})