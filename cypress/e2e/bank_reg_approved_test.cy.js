// This test suite is complex because it transitions between multiple sites:
// 1) The main user portal (where banking details are changed).
// 2) The external DocuSign site for the electronic signature process.
// 3) The App site (via a token) to verify the user's identity with photo/document checks.
// 4) The admin panel to confirm the results of the verification and rejection causes.
// It also checks email notifications and ensures the data flows correctly across these systems.


const lang = 'english'

// Import localization files and supporting libraries
import { faker } from '@faker-js/faker/locale/en';
import { langlist} from '/cypress/support/localization/langlist.ts';
import { languages } from '/cypress/support/localization/emails.ts';
const front = require(`/cypress/support/localization/${lang}/translation.json`);
const back = require(`/cypress/support/localization/${lang}/${lang}.ts`);


// Format dates in different required formats
const currentDate = new Date();
const day = currentDate.getDate().toString().padStart(2, '0');
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const month = monthNames[currentDate.getMonth()]; // Retrieve the month name from the array.
const year = currentDate.getFullYear().toString();
const formattedCurrentDate = `${day} ${month} ${year}`;


describe('Change Bank Information', () => {
  const userEmail = 'yourEmail@gmail.com'
  let token;
  const filePath='cypress/upload/file.jpg';

    before(() => {
      
      // Enable camera/microphone in the test environment
      cy.on('window:load', win => {
        win.parent.document
          .querySelector('.aut-iframe') // this selector is rather empirical
          .setAttribute('allow', 'camera;microphone')
      })

      // Generate random banking details with faker and save them to a fixture
      const bName = faker.word.noun();
      const address = `${faker.location.street()}, ${faker.number.int({ min: 1, max: 99})}`;
      const city = faker.location.city();
      const zip = faker.location.zipCode('########');
      const iban = faker.finance.accountNumber(13); //faker.finance.iban();
      const sort = faker.finance.accountNumber(6);
      const iName = faker.word.noun();
      const swift = faker.finance.bic();
      const acc = faker.finance.accountNumber();
      const bdata = {bName, address, city, zip, iban, sort, iName, swift, acc};
      cy.writeFile('cypress/fixtures/bdata.json', bdata);

    });

    it('Open Changing bank information section and filling it for Britain', () => {
      // Delete any leftover token from previous runs, then secure cookies
      cy.task('deleteTokenFile').then((result) => {
        cy.log(result);
      });
      cy.secureCookies();

      // Visit the main site and log in
      cy.visitWithRetry(Cypress.env('urlSite'));
      cy.get('button[aria-label="Language"]').click();
      cy.contains('li', langlist[lang]).click();
      cy.get(`input[placeholder="${front.login_form.username}"]`).type(Cypress.env('userLogin'));
      cy.get(`input[placeholder="${front.login_form.password}"]`).type(Cypress.env('userPass'), { log: false });
      cy.get('input[type="checkbox"]').check();
      cy.contains('button', front.login_form.login).click();

      // Fill out form with random banking details
      cy.fixture('bdata').then(bdata => {
        const {bName, address, city, zip, iban, sort, iName, swift, acc} = bdata;
        cy.contains('p',front.features.change_banking_details).click();
        cy.contains('div', front.bank_country).click();
        cy.contains('li', 'Great Britain').click();
        cy.get('input[name="bank_name"]').type(bName);
        cy.get('input[name="bank_address"]').type(address);
        cy.get('input[name="bank_city"]').type(city);
        cy.get('input[name="bank_zipcode"]').type(zip);
        cy.get('input[name="iban"]').type(iban);
        cy.get('input[name="iban1"]').type(iban);
        cy.get('input[name="sort"]').type(sort);
        cy.get('input[name="sort1"]').type(sort);
        cy.get('input[name="int_bank_name"]').type(iName);
        cy.get('input[name="swift"]').type(swift);
        cy.get('input[name="account_num"]').type(acc);
        cy.get('input[name="account_num1"]').type(acc);

        // Upload a file and submit the form
        cy.contains('h6', front.drop_files).selectFile(filePath, { action: 'drag-drop' }); //Drop Files Here"
        cy.contains('button', front.apply).click(); //Submit

        // Verify that the new banking details are displayed correctly on the preview screen
        cy.contains('span', 'Change Bank Details:', {timeout: 45000}).should('be.visible');
        cy.contains('span', 'BANK FORM UK').should('be.visible');
        cy.contains('span', bName).should('be.visible');
        cy.contains('span', address).should('be.visible');
        cy.contains('span', city).should('be.visible');
        cy.contains('span', 'Great Britain').should('be.visible');
        cy.contains('span', zip).should('be.visible');
        cy.contains('span', iban).should('be.visible');
        cy.contains('span', sort).should('be.visible');
        cy.contains('span', iName).should('be.visible');
        cy.contains('span', swift).should('be.visible');
        cy.contains('span', acc).should('be.visible');
        cy.contains('span', formattedCurrentDate).should('be.visible'); //Check current date
      });  

      // Click the signature icon and handle DocuSign
      cy.get('button[type="button"]').find('img[alt="signature icon"]', {timeout: 55000}).parent().click();
      cy.DocuSign();

      // Stop secure cookies to continue
      cy.stopSecureCookies();

      // Intercept token request for App
      cy.intercept('POST', `request/get_App_token/*`).as('tokenRequest');
      cy.get('img[alt="face logo"]', {timeout: 55000}).parent('button').click();
      // Wait for token, log it, and save to fixture
      cy.wait('@tokenRequest', { timeout: 30000 }).then(({ response }) => {
        expect(response.statusCode).to.eq(200);
        const { token } = response.body;
        expect(token).to.exist;
        cy.log(`Captured token: ${token}`);
        cy.writeFile('cypress/fixtures/token.json', { token });
      });

    });

    it('Registration App 1 attempt which leads to Approved status', () => { //depents on the 1 test
      // Use token to navigate to the App site
      cy.readFile('cypress/fixtures/token.json').then((data) => {
        cy.visit(`${Cypress.env('siteadmin')}portal?token=${data.token}`);
      });

      // Copy files required for the App verification
      cy.task('copyFiles', { doc: 'doc_approved', photo: 'photo_approved' });

      // Log in to App and complete photo/document steps
      cy.Applogin(userEmail, lang);

      cy.PhotoDocStart(lang);
      cy.PhotoDocCapture(lang);

      cy.AppConfirmationCheck(lang);

    });
  it('Checking text correctness of email', () => {
    // Wait for email to be delivered, then check that the correct content is present
    cy.wait(10000);
    cy.AppEmailCheck(languages[lang].approved, currentDate)
    cy.PortalEmailCheck(back[lang].ver1_4_0.bank_change, back[lang].email_confirmation2, currentDate)
  })  
    
  it('Enter to the Admin panel, check rejection cause', () => {
    cy.CheckRejectionCause(Cypress.env('userLogin'), 'APPROVED');
    cy.contains('h2', 'Verification type: Registration').scrollIntoView().should('be.visible');
    cy.contains('h2', 'Rejection cause: None').scrollIntoView().should('be.visible');
  })

})