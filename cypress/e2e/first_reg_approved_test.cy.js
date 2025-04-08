// This test suite simulates a single-attempt registration that gets "Approved" status. 
// It goes through uploading photos/docs, verifying contact details, checking 
// confirmation emails, and verifying the final status in the admin panel.

// choose language and import all language files
const lang = 'english'
import { texts } from '/cypress/support/localization/index.ts';
import { languages } from '/cypress/support/localization/emails.ts';
import { front } from '/cypress/support/localization/front.ts';
import { service } from '/cypress/support/localization/service.ts';

describe('Approved Registration', () => {
  const currentDate = new Date(); // Current date reference
  const userEmail = 'yourEmail@gmail.com' // Used for the registration flow
  
  before(() => {
    // Copy files needed for the "approved" scenario
    cy.task('copyFiles', { doc: 'doc_approved', photo: 'photo_approved' });
  })
    
  it('Registration which leads to Approved status after 1 attempt', () => {
    // Log in with initial credentials and run the doc/photo capture steps using email
    cy.login(Cypress.env('urlSite'), Cypress.env('RegNum'), Cypress.env('dobUser'), userEmail, lang);

    // Start the photo + document capture flow
    cy.PhotoDocStart(lang);
    cy.PhotoDocCapture(lang);

    // Confirm and check contact information
    cy.ContactConfirmation(userEmail, lang);
    
    cy.ContactConfirmationCheck(lang);
  })
    
  it('Checking text correctness of both emails', () => {  
    // Wait for emails to arrive, then verify their contents  
    cy.wait(5000);
    cy.AppEmailCheck(languages[lang].approved, currentDate)
    cy.AppContactEmailCheck(lang, currentDate)

  })  
    
  it('Enter to the Admin panel, check rejection cause send it to the logs', () => {
    // Confirm that the status is "APPROVED" and that there is no rejection cause
    cy.CheckRejectionCause(Cypress.env('RegNum'), 'APPROVED');
    cy.contains('h2', 'Verification type: Registration').scrollIntoView().should('be.visible');
    cy.contains('h2', 'Rejection cause: None').scrollIntoView().should('be.visible');
  })

})