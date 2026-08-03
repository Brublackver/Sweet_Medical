/*
  E2E — Visibilidad de los roles en el login.

  Verifica dos cosas que solo se ven en un navegador de verdad, porque dependen
  de la hidratación:
    1. El visitante común NO ve el acceso de administrador.
    2. La administración SÍ puede entrar, vía /login?admin=1.

  Recordatorio: esto es PRESENTACIÓN, no seguridad. Lo que protege el panel es
  requireAdmin en el backend. Este test cuida que no se filtre visualmente y,
  sobre todo, que no nos quedemos afuera sin querer.
*/

describe('Login — roles visibles', () => {

  it('el visitante ve Paciente, Médico y Probar, pero NO Admin', () => {
    cy.visit('/login');

    cy.contains('button', 'Paciente').should('be.visible');
    cy.contains('button', 'Médico').should('be.visible');
    cy.contains('button', 'Probar').should('be.visible');
    cy.contains('button', 'Admin').should('not.exist');
  });

  it('el rol "Probar" no pide credenciales', () => {
    cy.visit('/login');
    cy.contains('button', 'Probar').click();

    cy.contains('Entrá sin registrarte').should('be.visible');
    cy.get('#usuario').should('not.exist');
    cy.get('#password').should('not.exist');
    cy.contains('button', 'Crear cuenta de prueba').should('be.enabled');
  });

  it('con /login?admin=1 aparece el acceso de administrador', () => {
    cy.visit('/login?admin=1');

    cy.contains('button', 'Admin').should('be.visible');
    // Además queda preseleccionado: solo hay que poner la contraseña.
    cy.get('#password').should('be.visible');
    cy.get('#usuario').should('not.exist');
  });
});
