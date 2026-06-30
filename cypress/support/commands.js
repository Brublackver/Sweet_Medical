// cy.loginPaciente(usuario, password) — llena el formulario de login como paciente
Cypress.Commands.add('loginPaciente', (usuario = 'juantest', password = '1234') => {
  cy.visit('/login');
  cy.get('[aria-label="Tipo de usuario"]').contains('button', 'Paciente').click();
  cy.get('input[id="usuario"]').type(usuario);
  cy.get('input[type="password"]').first().type(password);
  cy.get('button[type="submit"]').click();
});

// cy.loginAdmin(password) — login como administrador
Cypress.Commands.add('loginAdmin', (password = '123456') => {
  cy.visit('/login');
  cy.get('[aria-label="Tipo de usuario"]').contains('button', 'Admin').click();
  cy.get('input[type="password"]').first().type(password);
  cy.get('button[type="submit"]').click();
});

// cy.stubLoginPaciente() — intercepta la API y simula login exitoso
Cypress.Commands.add('stubLoginPaciente', () => {
  cy.intercept('POST', '/auth/login', {
    statusCode: 200,
    body: {
      status: 'success',
      data: {
        token: 'fake-token-paciente',
        tipo:  'PACIENTE',
        usuario: {
          paciente_id: 1,
          usuario:     'juantest',
          nombre:      'Juan Test',
          dni:         '12345678',
          obraSocial:  'OSDE',
          plan:        { nombre: '310', coberturaGeneral: 80 },
        },
      },
    },
  }).as('loginRequest');
});
