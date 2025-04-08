// Test suite for verifying the login flow, including password masking,
// validation checks, and successful authentication with valid credentials.

describe('Login to the APP', () => {

  beforeEach(() => {
    // Before each test, visit the application's login page
    cy.visitWithRetry(Cypress.env('urlSite'));
  });

  it('Masks the password input', () => {
    // Type the password and ensure the field uses type="password"
    cy.get('#password_login_input').type(Cypress.env('userPass'));
    cy.get('#password_login_input').should('have.attr', 'type', 'password');
  });

  it('Shows "Password Required" error message for empty password', () => {
    // Enter valid username, leave password empty, submit, and verify error
    cy.get('#user_name_login_input').type(Cypress.env('userLogin'));
    cy.get('#password_login_input').clear();
    cy.get('#LOGIN_SUBMIT_BTN').click();
    cy.get('#filled-weight-helper-text').contains('Password Required').should('be.visible');
  });

  it('Shows "User name Required" error message for empty login', () => {
    // Leave the login field empty, submit, and verify error
    cy.get('#user_name_login_input').clear();
    cy.get('#LOGIN_SUBMIT_BTN').click();
    cy.get('#user_name_login_input-helper-text').contains('User name Required').should('be.visible');
  });

  it('Shows "User name Required", "Password Required" error messages for empty login and password', () => {
    // Leave both fields empty, submit, and verify both errors
    cy.get('#user_name_login_input').clear();
    cy.get('#password_login_input').clear();
    cy.get('#LOGIN_SUBMIT_BTN').click();
    cy.get('#user_name_login_input-helper-text').contains('User name Required').should('be.visible');
    cy.get('#filled-weight-helper-text').contains('Password Required').should('be.visible');
  });

  // List of invalid login/password pairs for testing login error messages
  const invalidLoginPasswordPairs = [
    {'login': Cypress.env('userLogin'), 'password': '123456789'},
    {'login': Cypress.env('userLogin'), 'password': 'Пароль'},
    {'login': Cypress.env('userLogin'), 'password': 'סיסמה'},
    {'login': Cypress.env('userAdmin'), 'password': Cypress.env('userPassword')},
    {'login': '1234567', 'password': Cypress.env('userPassword'),},
  ];

  invalidLoginPasswordPairs.forEach((param) => {
    it(`Shows "Username and password do not match" error message for wrong login and password pair`, () => {
       // Enter invalid credentials, submit, and check for the correct error message
      cy.wait(1000)
      cy.get('#user_name_login_input').clear().type(param.login);
      cy.get('#password_login_input').clear().type(param.password, { log: false });
      cy.get('#LOGIN_SUBMIT_BTN').click();
      cy.get('.MuiAlert-message').should('have.text', 'Username and password do not match.')
    });
  });

  it('Succesfully logins to the APP with valid login and password', () => {
    cy.get('#user_name_login_input').type(Cypress.env('userLogin'), { log: false }) //login
    cy.get('#password_login_input').type(Cypress.env('userPass'), { log: false }) //password
    cy.get('#LOGIN_SUBMIT_BTN').click();
    cy.get('#LOGOUT_BTN').should('exist');
  });

});    