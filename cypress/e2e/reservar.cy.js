const PACIENTE_ID = 1;

describe('Flujo de reserva de turno', () => {
  it('permite a un paciente buscar, seleccionar y confirmar un turno médico', () => {
    
    // ── 1. Intercepts e Inyección de Mocks ───────────────────────────────────
    // Usamos el comando global para mockear el login sin repetir el JSON largo
    cy.stubLoginPaciente(); 
    
    cy.intercept('GET', '/backend/turno/buscar*', { fixture: 'turnos.json' }).as('busqueda');

    cy.intercept('POST', `/backend/paciente/${PACIENTE_ID}/turno`, {
      statusCode: 201,
      body: { status: 'success', data: { turno_id: 999, estado: 'RESERVADO' } },
    }).as('reservar');

    // ── 2. Login Automatizado ────────────────────────────────────────────────
    // Invocamos el comando de interacción reutilizando la lógica del formulario
    cy.loginPaciente('juantest', '1234'); 
    
    // Esperamos el alias definido internamente dentro de cy.stubLoginPaciente()
    cy.wait('@loginRequest'); 

    cy.url().should('include', '/buscar');

    // ── 3. Buscar turnos disponibles ─────────────────────────────────────────
    cy.get('button[type="submit"]').contains(/buscar/i).click();
    cy.wait('@busqueda');

    cy.contains(/cardiolog/i).should('be.visible');
    cy.contains('Dr. García').should('be.visible');
    cy.contains('09:00').should('be.visible');

    // ── 4. Agregar al carrito ────────────────────────────────────────────────
    cy.contains('+ Solicitar').first().click();

    cy.get('nav').contains('1').should('exist');

    // ── 5. Ver solicitudes ───────────────────────────────────────────────────
    cy.get('nav a[href="/solicitudes"]').first().click();
    cy.url().should('include', '/solicitudes');

    cy.contains(/cardiolog/i).should('be.visible');
    cy.contains('Dr. García').should('be.visible');

    // ── 6. Ir a confirmación ─────────────────────────────────────────────────
    cy.get('a[href="/confirmar"]').click();
    cy.url().should('include', '/confirmar');

    cy.contains('Revisá los turnos antes de confirmar').should('be.visible');
    cy.contains(/cardiolog/i).should('be.visible');
    cy.contains('$1.000').should('be.visible');

    // ── 7. Confirmar la reserva ──────────────────────────────────────────────
    cy.contains('button', 'Confirmar solicitud').click();
    cy.wait('@reservar');

    cy.contains('¡Solicitud enviada!').should('be.visible');
    cy.contains('1 turno reservado').should('be.visible');
    cy.get('a[href="/mis-turnos"]').should('be.visible');
  });
});