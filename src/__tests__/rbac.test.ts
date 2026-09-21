import { describe, it, expect } from 'vitest';
import { UserRole } from '../types.ts';

interface AuthPermissions {
  canManageUsers: boolean;
  canEditPart: boolean;
  canDeletePart: boolean;
  canConsume: boolean;
  canRestock: boolean;
  canReorder: boolean;
  canResolveAlerts: boolean;
}

function computePermissions(role: UserRole): AuthPermissions {
  switch (role) {
    case 'admin':
      return {
        canManageUsers: true,
        canEditPart: true,
        canDeletePart: true,
        canConsume: true,
        canRestock: true,
        canReorder: true,
        canResolveAlerts: true,
      };
    case 'manager':
      return {
        canManageUsers: false,
        canEditPart: true,
        canDeletePart: false,
        canConsume: true,
        canRestock: true,
        canReorder: true,
        canResolveAlerts: true,
      };
    case 'technician':
      return {
        canManageUsers: false,
        canEditPart: false,
        canDeletePart: false,
        canConsume: true,
        canRestock: false,
        canReorder: false,
        canResolveAlerts: false,
      };
    case 'viewer':
    default:
      return {
        canManageUsers: false,
        canEditPart: false,
        canDeletePart: false,
        canConsume: false,
        canRestock: false,
        canReorder: false,
        canResolveAlerts: false,
      };
  }
}

describe('Role-Based Access Control (RBAC) Suite', () => {
  it('Admin has complete permissions across all modules', () => {
    const adminPerms = computePermissions('admin');
    expect(adminPerms.canManageUsers).toBe(true);
    expect(adminPerms.canEditPart).toBe(true);
    expect(adminPerms.canDeletePart).toBe(true);
    expect(adminPerms.canConsume).toBe(true);
    expect(adminPerms.canRestock).toBe(true);
    expect(adminPerms.canReorder).toBe(true);
    expect(adminPerms.canResolveAlerts).toBe(true);
  });

  it('Manager can restock and reorder, but cannot delete parts or manage users', () => {
    const mgrPerms = computePermissions('manager');
    expect(mgrPerms.canManageUsers).toBe(false);
    expect(mgrPerms.canDeletePart).toBe(false);
    expect(mgrPerms.canEditPart).toBe(true);
    expect(mgrPerms.canRestock).toBe(true);
    expect(mgrPerms.canReorder).toBe(true);
    expect(mgrPerms.canResolveAlerts).toBe(true);
  });

  it('Technician can log consumption, but cannot restock, edit, or manage users', () => {
    const techPerms = computePermissions('technician');
    expect(techPerms.canConsume).toBe(true);
    expect(techPerms.canRestock).toBe(false);
    expect(techPerms.canEditPart).toBe(false);
    expect(techPerms.canManageUsers).toBe(false);
  });

  it('Viewer is strictly read-only', () => {
    const viewerPerms = computePermissions('viewer');
    expect(viewerPerms.canConsume).toBe(false);
    expect(viewerPerms.canRestock).toBe(false);
    expect(viewerPerms.canEditPart).toBe(false);
    expect(viewerPerms.canDeletePart).toBe(false);
    expect(viewerPerms.canManageUsers).toBe(false);
    expect(viewerPerms.canReorder).toBe(false);
  });
});
