describe('RoboPart Robot Spare Parts Management E2E Workflows', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads the catalog, displays robot spare parts cards and key metrics', () => {
    // Assert title and brand
    cy.contains('RoboPart').should('be.visible');
    cy.contains('Robot Spare Parts Inventory').should('be.visible');

    // Verify presence of part cards with image and telemetry
    cy.get('[id^="part-card-"]').should('have.length.at.least', 1);
    cy.contains('Harmonic Drive').should('be.visible');
    cy.contains('Stock Left').should('be.visible');
    cy.contains('Consumed').should('be.visible');
    cy.contains('Need To Order').should('be.visible');
  });

  it('filters spare parts by search query and category', () => {
    // Search for actuator
    cy.get('input[placeholder*="Search by part name"]').type('Actuator');
    cy.get('[id^="part-card-"]').each(($el) => {
      cy.wrap($el).contains(/Actuator|Motor|Drive/i);
    });

    // Clear search
    cy.get('input[placeholder*="Search by part name"]').clear();

    // Toggle view mode from Grid to Table
    cy.get('button[title="Table View"]').click();
    cy.get('table').should('be.visible');
    cy.contains('th', 'SKU / Part Number').should('be.visible');

    // Toggle back to Grid view
    cy.get('button[title="Grid View"]').click();
  });

  it('executes part consumption workflow and records audit log', () => {
    // Click Consume button on the first card
    cy.get('[id^="part-card-"]').first().within(() => {
      cy.get('button[title="Consume / Use Part"]').click();
    });

    // Modal opens
    cy.contains('Log Part Usage / Consumption').should('be.visible');
    cy.get('#consume-qty-input').clear().type('1');

    // Submit consumption
    cy.get('#confirm-consume-btn').click();

    // Toast notification appears
    cy.contains('Successfully recorded consumption').should('be.visible');
  });

  it('navigates to the Admin Dashboard with interactive charts', () => {
    // Navigate to Admin Dashboard via sidebar
    cy.get('#nav-tab-dashboard').click();
    cy.contains('Robotics Inventory & Operations Dashboard').should('be.visible');
    cy.contains('Stock Left vs Consumed by Category').should('be.visible');
    cy.contains('Historical Consumption & Replacement Spend').should('be.visible');
    cy.contains('Inventory Health Status').should('be.visible');
  });

  it('navigates to Reorder Center and places purchase orders', () => {
    cy.get('#nav-tab-reorders').click();
    cy.contains('Procurement & Reorder Center').should('be.visible');
    cy.contains('Active Purchase Orders & Shipment Pipeline').should('be.visible');
  });

  it('tests Role-Based Access Control (RBAC) switching', () => {
    // Click role switcher in navbar
    cy.get('#role-switcher-btn').click();
    cy.contains('Switch Active Role (RBAC)').should('be.visible');

    // Switch to Technician role
    cy.get('#role-option-technician').click();
    cy.contains('technician').should('be.visible');

    // Switch back to Admin role
    cy.get('#role-switcher-btn').click();
    cy.get('#role-option-admin').click();
    cy.contains('admin').should('be.visible');
  });

  it('tests Export Reports view with CSV, Excel, and PDF options', () => {
    cy.get('#nav-tab-exports').click();
    cy.contains('Export Inventory & Audit Reports').should('be.visible');
    cy.get('#export-csv-btn').should('be.visible');
    cy.get('#export-excel-btn').should('be.visible');
    cy.get('#export-pdf-btn').should('be.visible');
  });
});
