// This test suite checks the "Forgot Password" process. 
// It makes sure a reset link is emailed, tests different password scenarios,
// and confirms that the old password fails while the new one succeeds.

const cheerio = require('cheerio'); // For parsing HTML content from emails
const lang = 'english' // Set the interface language

// Import relevant localization files
import { langlist } from '/cypress/support/localization/langlist.ts';
const front = require(`/cypress/support/localization/${lang}/translation.json`);
const back = require(`/cypress/support/localization/${lang}/${lang}.ts`);

describe('Check forgot password', () => {
  const filePath='cypress/upload/file.jpg';

  before(() => {
      // Visit the site and switch to prefered language before starting tests
      cy.visitWithRetry(Cypress.env('urlSite'));
      cy.get('button[aria-label="Language"]').click();
      cy.contains('li', langlist[lang]).click();
  });

  it('sends forgot password link to email', () => {
    // Click the "Forgot password" link and submit the form
    cy.contains('a', front.login_form.forgot_password).click();
    cy.contains('p', front.enter_reg_num).parent().find('input').type(Cypress.env('adminLogin'));
    cy.contains('button', 'send').click(); //Submit
    cy.PopUpCheck(back[lang].var_link)
    cy.url().should('eq', Cypress.env('urlSite'));
  });

  it('open the email, find the link and save it to the file', function () {
    // Use a Gmail API task to retrieve the email containing the reset link
    cy.task("gmail:get-messages", {
      options: {
          from: "SurvivorsPortal@claimscon.org",
        subject: back[lang].email_pass,
        include_body: true,
      },
    }).then((emails) => {
      assert.isAtLeast(
        emails.length,
        1,
        "Expected to find at least one email, but none were found!"
      );
      // Extract HTML content and parse with cheerio
      const body = emails[0].body.html;
      cy.log("Email Body:", body);
      const $ = cheerio.load(body);
      // Locate the password reset link
      const link = $(`a:contains('${back[lang].email_pass_ress.line_4}')`).attr('href');
      cy.log("Reset Password Link:", link);

      // Save the link to a fixture file
      cy.writeFile('cypress/fixtures/resetPassLink.json', { url: link });
    });
  });

  it('open the saved link and check password field ', () => {
    // Load the previously saved reset password link
    cy.fixture('resetPassLink').then(data => { //open saved link
      cy.visitWithRetry(data.url);
    });

    // Helper to test password inputs and check for validation/error messages
    const testPassword = (password1, password2, expectedMessage) => {
      cy.get(`input[placeholder="${front.login_form.password}"]`).clear().type(password1);
      cy.get('#outlined-adornment-password').clear().type(password2);
      cy.get('#actionButton').click();
      if (expectedMessage) {
        cy.contains(expectedMessage).should('be.visible');
        cy.log(`Password test for '${password1}' and '${password2}' failed as expected with message: ${expectedMessage}`);
      }
    };

    // Test various password cases, comparing input validation messages
    const testCases = [
      { pwd1: '123456', pwd2: '123456', message: front.validation.password_valid },
      { pwd1: 'abcdef', pwd2: 'abcdef', message: front.validation.password_valid },
      { pwd1: 'ABCDEF', pwd2: 'ABCDEF', message: front.validation.password_valid },
      { pwd1: 'abc12', pwd2: 'abc12', message: front.validation.password_valid },
      { pwd1: 'Cc123456', pwd2: 'cc123456', message: front.validation.password_dont_match },
      { pwd1: 'Cc123456', pwd2: 'Cc123456', message: null }
    ];

    testCases.forEach(({ pwd1, pwd2, message }) => {
      testPassword(pwd1, pwd2, message);
    });
    
    cy.PopUpCheck(back[lang].pass_used)
    // Set the new password to the one from environment variables
    cy.get(`input[placeholder="${front.login_form.password}"]`).clear().type(Cypress.env('adminPass'));
    cy.get('#outlined-adornment-password').clear().type(Cypress.env('adminPass'));
    cy.get('#actionButton').click();
    cy.PopUpCheck(back[lang].password_saved)

  });


  it('check that old password is not working', () => { //
    cy.visitWithRetry(Cypress.env('urlSite'));
    cy.get('button[aria-label="Language"]').click();
    cy.contains('li', langlist[lang]).click();
    cy.get(`input[placeholder="${front.login_form.username}"]`).type(Cypress.env('adminLogin'));
    cy.get(`input[placeholder="${front.login_form.password}"]`).type(Cypress.env('userPass'), { log: false });
    cy.get('input[type="checkbox"]').check();
    cy.contains('button', front.login_form.login).click();
    cy.contains(`Registration number and password don't match`).should('be.visible');
  });

  it('check that new password is working', () => { //
    cy.visitWithRetry(Cypress.env('urlSite'));
    cy.get('button[aria-label="Language"]').click();
    cy.contains('li', langlist[lang]).click();
    cy.get(`input[placeholder="${front.login_form.username}"]`).type(Cypress.env('adminLogin'));
    cy.get(`input[placeholder="${front.login_form.password}"]`).type(Cypress.env('adminPass'), { log: false });
    cy.get('input[type="checkbox"]').check();
    cy.contains('button', front.login_form.login).click();
    cy.url().should('include', '/user_page');
    
  });

});    