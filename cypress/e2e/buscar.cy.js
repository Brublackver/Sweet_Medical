const SESION_TOKEN = 'fake-token-paciente';
const PACIENTE_ID  = 1;

const stubSesion = () => {
  localStorage.setItem('token', SESION_TOKEN);
  cy.intercept('GET', `/paciente/${PACIENTE_ID}`, {
    statusCode: 200,
    body: { status: 'success', data: { paciente_id: PACIENTE_ID, nombre: 'Juan Test' } },
  });
};

describe('Buscar turno', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.intercept('POST', '/auth/login', {
      statusCode: 200,
      body: {
        status: 'success',
        data: { token: SESION_TOKEN, tipo: 'PACIENTE', usuario: { paciente_id: PACIENTE_ID, nombre: 'Juan Test' } },
      },
    }).as('login');

    cy.intercept('GET', '/sede', { statusCode: 200, body: { status: 'success', data: [] } });
    cy.intercept('GET', '/medico', { statusCode: 200, body: { status: 'success', data: [] } });

    cy.get('select').first().select('paciente');
    cy.get('input[type="text"], input[placeholder*="suario"]').first().type('juantest');
    cy.get('input[type="password"]').first().type('1234');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');
  });

  it('muestra el panel de filtros', () => {
    cy.url().should('include', '/buscar');
    cy.contains(/filtros/i).should('be.visible');
    cy.contains(/buscar turno/i).should('be.visible');
  });

  it('permite minimizar y expandir el panel de filtros', () => {
    cy.contains(/filtros/i).should('be.visible');
    cy.get('button[aria-label*="inimizar"], button[aria-label*="filtros"]').first().click();
    cy.get('button[aria-label*="xpandir"], button[aria-label*="filtros"]').first().click();
    cy.contains(/especialidad/i).should('be.visible');
  });

  it('muestra resultados al buscar', () => {
    cy.intercept('GET', '/turno/buscar*', { fixture: 'turnos.json' }).as('busqueda');

    cy.get('button[type="submit"]').contains(/buscar/i).click();

    cy.wait('@busqueda');
    cy.contains(/cardiolog/i).should('be.visible');
  });

  it('muestra estado vacío cuando no hay turnos disponibles', () => {
    cy.intercept('GET', '/turno/buscar*', {
      statusCode: 200,
      body: { status: 'success', data: [] },
    }).as('busquedaVacia');

    cy.get('button[type="submit"]').contains(/buscar/i).click();
    cy.wait('@busquedaVacia');

    cy.contains(/sin resultados/i).should('be.visible');
  });

  it('permite limpiar los filtros', () => {
    cy.get('input[id="especialidad"], input[placeholder*="specialidad"]').first().type('Cardiología');
    cy.contains(/limpiar/i).click();
    cy.get('input[id="especialidad"], input[placeholder*="specialidad"]').first().should('have.value', '');
  });
});
