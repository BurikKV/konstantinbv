//File created for one of the projects in where I manage the choice of language
// as well as a large number of different translation files 
// intended for checking the European and Russian versions of the site

export const language = 'ru';
let useSysLangFirst = false;

// Define the faker instance based on the language
import { faker as enfaker } from '@faker-js/faker/locale/en';
import { faker as rufaker } from '@faker-js/faker/locale/ru';
import { faker as esfaker } from '@faker-js/faker/locale/es';
import { faker as defaker } from '@faker-js/faker/locale/de';
const fakers = { en: enfaker, ru: rufaker, es: esfaker, de: defaker };
export const faker = fakers[language];

// Load language files for the public site
// If the language is 'ru', load the Russian language file, otherwise load the European language file
const locale = language === 'ru' 
  ? require('/cypress/support/localization/mainRU.json') 
  : require('/cypress/support/localization/mainEU.json');
// Get the text from the loaded localization file for the given language
export const text = locale.base.language[language];

// Load language files for the company site and personal account page
// If the language is not 'ru', load the respective JSON files
export const getLang = language !== 'ru' ? require(`/cypress/support/localization/${language}.json`) : {};
export const sysLang = language !== 'ru' ? require(`/cypress/support/localization/sys_${language}.json`) : {};

// Function to return the correct localized value based on the provided key
export function lang(key) {
  if (language === 'ru') {
    return key; // If language is 'ru', return the key as it is
  } else if (useSysLangFirst) {
    return sysLang[key] || getLang[key] || key;
  } else {
    return getLang[key] || sysLang[key] || key; // Otherwise, return the translation or the key if not found
  }
}

export function setUseSysLangFirst(value) {
  useSysLangFirst = value;
}

// Domain mapping for different languages
export const domainMap = { 
  'ru': 'io',  // Use 'io' for Russian language
  'eu': 'ai',  // Use 'ai' for all other languages
};
