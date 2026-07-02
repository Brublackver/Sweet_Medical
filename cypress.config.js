import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl:     'http://localhost:3001',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    viewportWidth:  1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
  },
});
