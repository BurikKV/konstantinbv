// This test covers a registration scenario where the user’s document lacks a date of birth,
// leading to a “Pending” status after three attempts. It goes through uploading photos/docs, 
// verifying contact details, checking confirmation sms, and verifying the final status in the admin panel.

// choose language and import all language files
const lang = 'english'
import { texts } from '/cypress/support/localization/index.ts';
import { languages } from '/cypress/support/localization/emails.ts';
import { front } from '/cypress/support/localization/front.ts';
import { service } from '/cypress/support/localization/service.ts';

describe('Registration without dob on the document which leads to Pending status', () => {
  
  before(() => {
    // Copy files needed for the "pending" scenario
    cy.task('copyFiles', { doc: 'doc_no_dob', photo: 'photo_approved' });
  })
  
  it('Registration without dob on the document which leads to Pending after 3 attempts', () => {
    // Log in with initial credentials and run the doc/photo capture steps using phone number
    cy.loginPhone(Cypress.env('urlSite'), Cypress.env('RegNum'), Cypress.env('dobUser'), lang);
    // Alternative for Log in id and phone number
    //cy.loginPhoneTZ(Cypress.env('urlSite'), Cypress.env('tz'), Cypress.env('dobUser'), lang);

    // Start the photo + document capture flow
    cy.PhotoDocStart(lang);
    cy.PhotoDocCapture(lang);

    // Check if the document's back side is required
    cy.isDocBack(lang);

    // Retry the flow copying the original files to their place
    cy.tryAgain(lang, 'doc_no_dob', 'photo_approved');
    cy.wait(10000);
    // Capture a new doc photo
    cy.PhotoDocCapture(lang);

    // Retry the flow copying the new files for last attempt
    cy.tryAgain(lang, 'doc_no_dob', 'photo_approved_old');
    cy.wait(5000);

    // Start and capture again (final attempt)
    cy.PhotoDocStart(lang);
    cy.PhotoDocCaptureOld(lang);

    // Verify that the user sees confirmation texts indicating the flow outcome
    Object.keys(texts[lang].AppConfirm).forEach(key =>
      cy.contains('h1', texts[lang].AppConfirm[key], {timeout: 25000}).should('be.visible')  
    );

  })

  it('Checking text correctness of sms', () => {
    // Wait for the system to send the text message, then validate its contents
    cy.wait(10000);
    cy.fetchSMS(languages[lang].pending);
  }) 

  it('Enter to the Admin panel and send rejection cause to the logs', () => {
    // Confirm that the status is "PENDING" and that there is a specific cause
    cy.CheckRejectionCause(Cypress.env('RegNum'), 'PENDING');
    cy.contains('h2', 'Verification type: Registration').scrollIntoView().should('be.visible');
    cy.contains('h2', `Could not detect face in document image.,Failed to verify document holder's birthday against supplied name.`).scrollIntoView().should('be.visible');
  })
  
})