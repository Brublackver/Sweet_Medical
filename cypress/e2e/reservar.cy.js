const SESION_TOKEN = 'fake-token-paciente';
const PACIENTE_ID  = 1;

const stubAuth = () => {
  cy.intercept('POST', '/auth/login', {
    statusCode: 200,
    body: {
      status: 'success',
      data: {
        token:   SESION_TOKEN,
        tipo:    'PACIENTE',
        usuario: { paciente_id: PACIENTE_ID, nombre: 'Juan Test', obraSocial: 'OSDE', plan: { coberturaGeneral: 80 } },
      },
    },
  }).as('login');
};

const hacerLogin = () => {
  cy.visit('/login');
  cy.get('select').first().select('paciente');
  cy.get('input[type="text"], input[placeholder*="suario"]').first().type('juantest');
  cy.get('input[type="password"]').first().type('1234');
  cy.get('button[type="submit"]').click();
  cy.wait('@login');
};

describe('Reservar turno — flujo completo', () => {
  beforeEach(() => {
    cy.intercept('GET', '/sede',   { statusCode: 200, body: { status: 'success', data: [] } });
    cy.intercept('GET', '/medico', { statusCode: 200, body: { status: 'success', data: [] } });
    stubAuth();
    hacerLogin();
  });

  it('navega a buscar luego de iniciar sesión', () => {
    cy.url().should('include', '/buscar');
  });

  it('agrega un turno al carrito y muestra el badge', () => {
    cy.intercept('GET', '/turno/buscar*', { fixture: 'turnos.json' }).as('busqueda');

    cy.get('button[type="submit"]').contains(/buscar/i).click();
    cy.wait('@busqueda');

    cy.contains(/cardiolog/i).should('be.visible');
    cy.contains(/agregar/i).first().click();

    cy.get('nav').contains(/1/).should('exist');
  });

  it('navega al carrito con el turno seleccionado', () => {
    cy.intercept('GET', '/turno/buscar*', { fixture: 'turnos.json' }).as('busqueda');

    cy.get('button[type="submit"]').contains(/buscar/i).click();
    cy.wait('@busqueda');

    cy.contains(/agregar/i).first().click();
    cy.get('nav a[href*="carrito"], nav a[href*="cart"]').first().click();

    cy.url().should('include', '/carrito');
    cy.contains(/cardiolog/i).should('be.visible');
  });

  it('confirma la reserva desde el carrito', () => {
    cy.intercept('GET', '/turno/buscar*', { fixture: 'turnos.json' }).as('busqueda');
    cy.intercept('POST', `/paciente/${PACIENTE_ID}/turno`, {
      statusCode: 201,
      body: { status: 'success', data: { turno_id: 999, estado: 'RESERVADO' } },
    }).as('reservar');

    cy.get('button[type="submit"]').contains(/buscar/i).click();
    cy.wait('@busqueda');

    cy.contains(/agregar/i).first().click();
    cy.get('nav a[href*="carrito"], nav a[href*="cart"]').first().click();

    cy.url().should('include', '/carrito');
    cy.contains(/confirmar/i).click();

    cy.wait('@reservar');
    cy.url().should('include', '/confirmacion');
  });
});
