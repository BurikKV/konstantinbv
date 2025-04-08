//import all language files
import { texts } from '/cypress/support/localization/index.ts';
import { front } from '/cypress/support/localization/front.ts';
import { service } from '/cypress/support/localization/service.ts';

const cheerio = require('cheerio');


// function to check excel file
Cypress.Commands.add('checkExcel', (fileName, fileData, optionalCheck) => {
  cy.wait(5000);
  cy.task('getLastDownloadedFile').then((filePath) => {
    expect(filePath).to.be.a('string');
    expect(filePath).to.include(fileName);
    if (optionalCheck) {
      expect(filePath).to.include(optionalCheck);
    }
    expect(filePath).to.match(/\.csv?$/);
    cy.log(filePath);
    cy.task('convertXLsxToJson', filePath);
    cy.wait(1000);
    cy.readFile('cypress/fixtures/ExcelData.json').then((data) => {
      fileData(data);
    });
  });
});

// function to check last sms
Cypress.Commands.add('fetchSMS', (smstext) => {
  cy.task('fetchSMS').then(smsMessages => {
    expect(smsMessages.length, 'Number of SMS messages').to.be.greaterThan(0);
    const lastSMS = smsMessages[0]; // Assuming the messages are already sorted by date
    expect(lastSMS.body).to.include(smstext);
  });
});

// Check email for confirmation email
Cypress.Commands.add('EmailCheck', (emessage, currentDate) => {
  cy.task("gmail:get-messages", {
    options: {
        from: "DoNotReply@test.com",
      subject: "TEST_SUBJECT",
      after: currentDate,
      include_body: true,

    },
  }).then((emails) => {
    assert.isAtLeast(
      emails.length,
      1,
      "Expected to find at least one email, but none were found!"
    );
    const body = emails[0].body.html;
    cy.log("Email Body:", body);

    const $ = cheerio.load(body);
    const expectedMessage = emessage;
    assert.isTrue(
      $(`body:contains('${expectedMessage}')`).length > 0,
      "The email body does not contain the expected message."
    );
  });
});

// function to work with iframe windows
Cypress.Commands.add('getIframeBody', (iframeSelector) => {
  return cy
    .get(iframeSelector)
    .its('0.contentDocument.body').should('not.be.empty')
    .then(cy.wrap);
  });

 //  Azure Active Directory Authentication  
 function loginViaAAD(username, password) {
  cy.visit(Cypress.env('urlSite'))
  cy.origin(
    'login.microsoftonline.com',
    {
      args: {
        username,
      },
    },
    ({ username }) => {
      cy.get('input[type="email"]').type(username, {log: false,})
      cy.get('input[type="submit"]').click()
    }
  )

  cy.origin(
    'login.microsoftonline.com',
   {
     args: {
       password,
     },
  },
  ({ password }) => {
    cy.get('input[type="password"]').type(password, {log: false,})
    cy.get('input[type="submit"]').click()
  }
  )
  // Ensure Microsoft has redirected us back to the sample app with our logged in user.
  cy.url().should('equal', (Cypress.env('urlSite')))

}

Cypress.Commands.add('loginMS', (username, password) => {
  const log = Cypress.log({
    displayName: 'Azure Active Directory Login',
    message: [`🔐 Authenticating | ${username}`],
    autoEnd: false,
  })
  loginViaAAD(username, password)
})

// function to generate ID number
Cypress.Commands.add('generateIid', () => {
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getInc(num, i) {
    var inc = Number(num) * ((i % 2) + 1);
    return (inc > 9) ? inc -= 9 : inc;
  }

  let iid = "", num, counter = 0;
  for (let i = 0; i < 8; i++) {
    num = getRandomInt((i < 2) ? 2 : 0, (i < 2) ? 3 : 9);
    iid += num.toString();
    counter += getInc(num, i);
  }
  return iid + (10 - (counter % 10)).toString();
});


//function to retry connection attempts
Cypress.Commands.add('visitWithRetry', (url, attempts = 3) => {
  const visitTest = (currentAttempt) => {
    return cy.request({
      url: url,
      failOnStatusCode: false 
    }).then(response => {
      if (response.status === 200) {
        return cy.visit(url); 
      } else if (currentAttempt < attempts) {
        cy.wait(5000);
        return visitTest(currentAttempt + 1);
      } else {
        throw new Error('Failed to load page after ' + attempts + ' attempts');
      }
    });
  };
  return visitTest(0);
});

// function to store cookies between two sites
/* Workaround for a bug in Cypress: https://github.com/cypress-io/cypress/issues/26398#issuecomment-1847112026 */
Cypress.Commands.add('secureCookiesOLD', () => {
  cy.intercept('*', (req) => {
    req.on('response', (res) => {
      const setCookies = res.headers['set-cookie'];
      if (setCookies) {
        res.headers['set-cookie'] = (
          Array.isArray(setCookies) ? setCookies : [setCookies]
        )
        .map((cookie) => {
          // Ensure SameSite=None and Secure are set
          if (!cookie.includes('SameSite=')) {
            cookie += '; SameSite=None';
          } else {
            cookie = cookie.replace(/SameSite=(Lax|Strict)/i, 'SameSite=None');
          }

          if (!cookie.includes('Secure')) {
            cookie += '; Secure';
          }

          return cookie;
        });
      }
    });
  });
});

Cypress.env('modifyCookies', true);

Cypress.Commands.add('secureCookies', () => {
  cy.intercept('*', (req) => {
    if (!Cypress.env('modifyCookies')) return;

    req.on('response', (res) => {
      const setCookies = res.headers['set-cookie'];
      if (setCookies) {
        res.headers['set-cookie'] = (
          Array.isArray(setCookies) ? setCookies : [setCookies]
        )
        .map((cookie) => {
          // Preserve HttpOnly if present
          const httpOnlyPart = cookie.includes('HttpOnly') ? '; HttpOnly' : '';
          
          // Ensure SameSite=None and Secure are set, preserving HttpOnly
          if (!cookie.includes('SameSite=')) {
            cookie += `; SameSite=None${httpOnlyPart}`;
          } else {
            cookie = cookie.replace(/SameSite=(Lax|Strict)/i, `SameSite=None${httpOnlyPart}`);
          }

          if (!cookie.includes('Secure')) {
            cookie += '; Secure';
          }

          return cookie;
        });
      }
    });
  });
});

Cypress.Commands.add('stopSecureCookies', () => {
  Cypress.env('modifyCookies', false);
});

//DocuSign Portal-App signing
Cypress.Commands.add('DocuSign', () => {
  cy.origin(Cypress.env('addurl'), () => {
    // Handle potential cookie error
    cy.get('body', { timeout: 75000 }).then((body) => {
      if (body.find('div[data-qa="error-dialog-content"]').length > 0) {
        cy.get('button[data-qa="error-dialog-submit-button"]', { timeout: 25000 }).click();
      } else {cy.log('No errors found, continuing with test.')}
    });
     // Click the 'Continue' button
    cy.contains('.signature-tab-content', 'Sign', { timeout: 55000 }).click();

    // Check for modal window visibility
    function checkModal(retryCount = 5) {
      if (retryCount > 0) {
        cy.get('body').then(body => {
          const modal = body.find('#adopt-dialog');
          if (modal.length > 0 && modal.is(':visible')) {
            cy.wrap(modal).within(() => {
              cy.contains('button', 'Adopt and Sign').should('be.visible').click();
            });
          } else {
            cy.log('Adopt and Sign modal not found, retrying...');
            cy.wait(1000); // wait for 1 second before retrying
            checkModal(retryCount - 1); // recursive call to retry
          }
        });
      } else {
        cy.log('Adopt and Sign modal not found after retries, continuing with test.');
      }
    }

    checkModal(); // initiate the polling
    cy.wait(10000);
    cy.get('#end-of-document-btn-finish-mobile', { timeout: 45000 }).click({force: true});
  });  
})


// different function
// which us used

// function login to the app
  Cypress.Commands.add('login', (username, password) => {
    //cy.session ('userSession', () => {
    cy.visit(Cypress.env('urlSite'));
    cy.get('.nav-item').contains('my account').click();
    cy.url().should('include','/login/form/');
    cy.get('#login').type(username, { log: false }); //login
    cy.get('#password').type(password, { log: false }); //password
    cy.contains('button', 'Log in').click();
    //cy.url().should('eq', (Cypress.env('regurl')));
    //})
  })

// function login to the company
  Cypress.Commands.add('loginCompany', (username, password) => {
    cy.session ('userSession', () => {
    cy.fixture('companyData').then((data) => {
        cy.visit(`${data.domain}.golova.io`);
        cy.get('#username').type(username, { log: false }); //login
        cy.get('#password').type(password, { log: false }); //password
        cy.get("[type='submit']").click();
    })    
    });
  });

// function to navigate in the upper menu
Cypress.Commands.add('navTo', (menuItem) => {
  cy.contains('button, a', menuItem).click();
});   

// Cypress sees that the form is submitted. preventDefault and returns that there was a form submit.
Cypress.Commands.add('preventFormSubmitDefault', (selector) => {
  cy.get(selector).then(($form) => {
    $form.on('submit', (e) => {
      e.preventDefault();
    });
  });
});

// function to login
Cypress.Commands.add('login2', (urlSite, userLogin, dobUser, email, lang) => {
  cy.visitWithRetry(urlSite);
  cy.get(`button#${lang}`).click();
  cy.get('[name="registrationNumber"]').type(userLogin);
  cy.get('[placeholder="MM/DD/YYYY"]').type(dobUser);
  cy.contains('[type="submit"]', texts[lang].startValidation).click();  //Click to continue
  cy.get('input[type="radio"][value="email"]').then(($radio) => {
    if (!$radio.is(':checked')) {$radio.click();}
  }).should('be.checked');
  cy.get('#email_field').clear().type(email);
  cy.get('input[type="checkbox"]').check();
  cy.contains('[type="submit"]', texts[lang].startValidation).click(); //Click to continue
  cy.contains('p', texts[lang].followInstructions).should('be.visible'); //Continue
  cy.get('#continue').click();
})

//function to reset claimant attemtps
Cypress.Commands.add('adminPanelReset', () => {
  cy.visitWithRetry(Cypress.env('siteadmin'));
  cy.get('input[name="username"]').type(Cypress.env('loginAdmin'));
  cy.get('input[name="password"]').type(Cypress.env('passAdmin'), { log: false });
  cy.get('input[name="rememberMe"]').check();
  cy.get('button[type="submit"]').click();
  cy.get('input[name="input"]').type(Cypress.env('userLogin'));
  cy.get('button[type="submit"]').contains('Search').click();
  cy.contains('tr', '9999999').find('button[type="button"]').contains('reset claiment').click();
  cy.contains('button[type="button"]', 'Proceed').click();
  cy.get('.MuiAlert-message', { timeout: 5000 }).should('be.visible').contains('the case was deleted');
});

//function to check rejecton cause
Cypress.Commands.add('CheckRejectionCause', (user) => {
  cy.visitWithRetry(Cypress.env('siteadmin'));
  cy.get('input[name="username"]').type(Cypress.env('loginAdmin'));
  cy.get('input[name="password"]').type(Cypress.env('passAdmin'), { log: false });
  cy.get('input[name="rememberMe"]').check();
  cy.get('button[type="submit"]').click();
  cy.get('input[name="input"]').type(user);
  cy.get('button[type="submit"]').contains('Search').click();
  cy.contains('tr', user).find('button[type="button"]').contains('VIEW').click();
  cy.contains('h2', 'Rejection cause:', { timeout: 15000 }).invoke('text').then(text => {
    cy.log(`${text}`);
  });
});

//function to make photo and doc for registration process
Cypress.Commands.add('PhotoDocCapture', (lang) => {
  cy.contains('p', texts[lang].frameFaceOval).should('be.visible');
  cy.get('#continue').should('be.visible').click();
  cy.contains('[type="button"]', texts[lang].capture, { timeout: 5000 }).should('be.visible').click();
  cy.contains('p', texts[lang].confirmImage).should('be.visible');
  cy.contains('[type="button"]', texts[lang].continue).click();
  cy.task('docImage');
  cy.contains('p', texts[lang].TakePhotoDocument).should('be.visible');
  cy.contains('[type="button"]', texts[lang].continue).should('be.visible').click();
  cy.contains('[type="button"]', texts[lang].capture, { timeout: 5000 }).should('be.visible').click();
  cy.contains('p', texts[lang].confirmImage).should('be.visible');
  cy.contains('[type="button"]', texts[lang].send).click();
});

//function to make photo for authentication process
Cypress.Commands.add('PhotoCapture', (lang) => {
  cy.contains('p', texts[lang].frameFaceOval).should('be.visible') //Please frame your face in the oval
  cy.get('#continue').should('be.visible').click();
  cy.contains('[type="button"]', texts[lang].capture, { timeout: 5000 }).should('be.visible').click(); //Take photo
  cy.contains('p', texts[lang].confirmImage).should('be.visible') //Please confirm the image
  cy.contains('[type="button"]', texts[lang].send).click(); //Send
});

//function to Confirm Contact Information
Cypress.Commands.add('ContactConfirmation', (email, lang) => {
  cy.get('#loading', { timeout: 95000 }).should('not.be.visible') //check that loading screen is off
  cy.get('h3').contains( texts[lang].confirm_info[0]).should('be.visible');
   
  cy.get('#address').click();
  cy.get('#address_input').clear().type('Pisecka 18');
  cy.get('#action_button').click();
  cy.get('#suggestion0').click();

  cy.get('input[name="street"]').clear().type('Pisecka');
  cy.get('input[name="building"]').clear().type('24');
  cy.get('input[name="apt"]').clear().type('450');
  cy.get('input[name="city"]').clear().type('Prague');
  cy.get('input[name="zipcode"]').clear().type('10333');
  cy.contains('button', texts[lang].cancel).should('be.visible');
  cy.contains('button', texts[lang].update).click();

  cy.get('#phone').click()
  cy.get('#countries').click()
  cy.contains('li', 'Israel').click();
  cy.get('#country_code').should('have.value', '+972');
  cy.get('#phone_field').type('0535991299');
  cy.contains('button', texts[lang].cancel).should('be.visible');
  cy.contains('button', texts[lang].update).click();

  cy.get('#email').click();
  cy.get('#email_field').clear().type(email);
  cy.contains('button', texts[lang].cancel).should('be.visible');
  cy.contains('button', texts[lang].update).click();

  cy.get('#confirm_button').click();

});

Cypress.Commands.add('ContactConfirmationCheck', (lang) => {
  Object.keys(texts[lang].contactInfoConfirm).forEach(key => {
    cy.contains('h1', texts[lang].contactInfoConfirm[key], {timeout: 20000}).should('be.visible');
  });
  cy.contains('a', texts[lang].contactInfoConfirm.par3).should('have.attr', 'href', 'https://survivorsportal.claimscon.org');
});



// function to login for Previously verifed
Cypress.Commands.add('prevlogin', (urlSite, lang) => {
  cy.visitWithRetry(urlSite);
  cy.get(`button#${lang}`).click();
  cy.contains('button', texts[lang].previouslyVerified).click();
  cy.contains('button', front[lang].begin).click();
  cy.get('face-liveness').shadow().find('button[data-e2e="get-ready"]').should('be.visible').click();
  cy.get('face-liveness').shadow().find('[data-e2e="message-text"]', { timeout: 35000 }).should('not.contain.text',  service[lang].prep).and ('not.contain.text', service[lang].prepCam);
})










