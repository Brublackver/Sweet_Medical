const PACIENTE_ID = 1;

describe('Flujo de reserva de turno', () => {
  it('permite a un paciente buscar, seleccionar y confirmar un turno médico', () => {
    // ── Intercepts ──────────────────────────────────────────────────────────
    cy.intercept('POST', '/backend/auth/login', {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          token:   'fake-token-paciente',
          tipo:    'PACIENTE',
          usuario: {
            paciente_id: PACIENTE_ID,
            nombre:      'Juan Test',
            obraSocial:  'OSDE',
            plan:        { coberturaGeneral: 80 },
          },
        },
      },
    }).as('login');

    cy.intercept('GET', '/backend/turno/buscar*', { fixture: 'turnos.json' }).as('busqueda');

    cy.intercept('POST', `/backend/paciente/${PACIENTE_ID}/turno`, {
      statusCode: 201,
      body: { status: 'success', data: { turno_id: 999, estado: 'RESERVADO' } },
    }).as('reservar');

    // ── 1. Login ─────────────────────────────────────────────────────────────
    cy.visit('/login');
    cy.get('[aria-label="Tipo de usuario"]').contains('button', 'Paciente').click();
    cy.get('input[id="usuario"]').type('juantest');
    cy.get('input[type="password"]').first().type('1234');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');

    cy.url().should('include', '/buscar');

    // ── 2. Buscar turnos disponibles ─────────────────────────────────────────
    cy.get('button[type="submit"]').contains(/buscar/i).click();
    cy.wait('@busqueda');

    cy.contains(/cardiolog/i).should('be.visible');
    cy.contains('Dr. García').should('be.visible');
    cy.contains('09:00').should('be.visible');

    // ── 3. Agregar al carrito ────────────────────────────────────────────────
    cy.contains('+ Solicitar').first().click();

    cy.get('nav').contains('1').should('exist');

    // ── 4. Ver solicitudes ───────────────────────────────────────────────────
    cy.get('nav a[href="/solicitudes"]').first().click();
    cy.url().should('include', '/solicitudes');

    cy.contains(/cardiolog/i).should('be.visible');
    cy.contains('Dr. García').should('be.visible');

    // ── 5. Ir a confirmación ─────────────────────────────────────────────────
    cy.get('a[href="/confirmar"]').click();
    cy.url().should('include', '/confirmar');

    cy.contains('Revisá los turnos antes de confirmar').should('be.visible');
    cy.contains(/cardiolog/i).should('be.visible');
    cy.contains('$1.000').should('be.visible');

    // ── 6. Confirmar la reserva ──────────────────────────────────────────────
    cy.contains('button', 'Confirmar solicitud').click();
    cy.wait('@reservar');

    cy.contains('¡Solicitud enviada!').should('be.visible');
    cy.contains('1 turno reservado').should('be.visible');
    cy.get('a[href="/mis-turnos"]').should('be.visible');
  });
});
