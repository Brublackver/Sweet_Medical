describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('muestra el formulario de login', () => {
    cy.get('form').should('exist');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('login de admin exitoso redirige al panel admin', () => {
    cy.intercept('POST', '/auth/login', {
      statusCode: 200,
      body: {
        status: 'success',
        data: { token: 'tok-admin', tipo: 'ADMIN', usuario: { rol: 'admin' } },
      },
    }).as('loginAdmin');

    cy.get('select').first().select('admin');
    cy.get('input[type="password"]').first().type('123456');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginAdmin');
    cy.url().should('include', '/admin');
  });

  it('login de paciente exitoso redirige a buscar turno', () => {
    cy.intercept('POST', '/auth/login', { fixture: 'sesion-paciente.json' }).as('loginPac');
    cy.intercept('GET', '/paciente/*', {
      statusCode: 200,
      body: { status: 'success', data: { paciente_id: 1, nombre: 'Juan Test' } },
    });

    cy.get('select').first().select('paciente');
    cy.get('input[type="text"], input[placeholder*="suario"]').first().type('juantest');
    cy.get('input[type="password"]').first().type('1234');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginPac');
    cy.url().should('include', '/buscar');
  });

  it('muestra error cuando las credenciales son incorrectas', () => {
    cy.intercept('POST', '/auth/login', {
      statusCode: 401,
      body: { status: 'fail', message: 'Usuario o contraseña incorrectos' },
    }).as('loginFail');

    cy.get('select').first().select('admin');
    cy.get('input[type="password"]').first().type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginFail');
    cy.get('body').should('contain.text', 'incorrectos');
  });

  it('tiene link para ir al registro', () => {
    cy.contains('a', /regist/i).should('exist').click();
    cy.url().should('include', '/registro');
  });
});
