import { expect, test } from '@playwright/test';
import type { UserAccount } from '../../src/api/types';
import { defaultAdminPrincipal, fulfillJson, rejectUnexpectedApi } from './support/http';

const existingAdmin: UserAccount = {
  id: defaultAdminPrincipal.id,
  username: defaultAdminPrincipal.username,
  identityType: 'HUMAN',
  enabled: true,
  roles: ['USER', 'ADMIN'],
  createdAt: '2026-09-17T09:00:00Z',
  updatedAt: '2026-09-17T09:00:00Z',
};

const createdViewer: UserAccount = {
  id: '88888888-8888-4888-8888-888888888888',
  username: 'results-viewer',
  identityType: 'HUMAN',
  enabled: true,
  roles: ['USER', 'VIEWER'],
  createdAt: '2026-09-17T10:00:00Z',
  updatedAt: '2026-09-17T10:00:00Z',
};

test('ADMIN creates an identity through the backend contract with CSRF proof', async ({ page }) => {
  const users = [existingAdmin];
  let createCsrf: string | null = null;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/admin/users' && request.method() === 'GET') {
      return fulfillJson(route, users);
    }
    if (url.pathname === '/api/v1/admin/users' && request.method() === 'POST') {
      createCsrf = request.headers()['x-csrf-token'] ?? null;
      expect(request.postDataJSON()).toEqual({
        username: createdViewer.username,
        password: 'fixture-secret',
        identityType: 'HUMAN',
        enabled: true,
        roles: ['USER', 'VIEWER'],
      });
      users.push(createdViewer);
      return fulfillJson(route, createdViewer, 201);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/users');
  await page.evaluate(() => {
    document.cookie = 'XSRF-TOKEN=identity-admin-proof; Path=/; SameSite=Strict';
  });

  await expect(page.getByRole('row', { name: new RegExp(existingAdmin.username) })).toBeVisible();
  await page.getByLabel('Username').fill(createdViewer.username);
  await page.getByLabel('Password').fill('fixture-secret');
  await page.getByRole('checkbox', { name: 'VIEWER' }).check();
  await page.getByRole('button', { name: 'Create identity' }).click();

  await expect.poll(() => createCsrf).toBe('identity-admin-proof');
  await expect(page.getByRole('row', { name: new RegExp(createdViewer.username) })).toBeVisible();
});

test('identity editing replaces enabled state and roles while preserving immutable identity fields', async ({ page }) => {
  let user = createdViewer;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/admin/users' && request.method() === 'GET') {
      return fulfillJson(route, [user]);
    }
    if (url.pathname === `/api/v1/admin/users/${createdViewer.id}` && request.method() === 'PUT') {
      expect(request.postDataJSON()).toEqual({
        enabled: false,
        roles: ['USER', 'VIEWER', 'ADMIN'],
      });
      user = {
        ...user,
        enabled: false,
        roles: ['USER', 'VIEWER', 'ADMIN'],
        updatedAt: '2026-09-17T11:00:00Z',
      };
      return fulfillJson(route, user);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/users');
  await page.evaluate(() => {
    document.cookie = 'XSRF-TOKEN=identity-update-proof; Path=/; SameSite=Strict';
  });

  await page.getByRole('button', { name: `Edit identity ${createdViewer.username}` }).click();
  await expect(page.getByLabel('Username')).toBeDisabled();
  await expect(page.getByLabel('Identity type')).toBeDisabled();
  await expect(page.getByLabel('Password')).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'ADMIN' }).check();
  await page.getByRole('checkbox', { name: 'Enabled' }).uncheck();
  await page.getByRole('button', { name: 'Save changes' }).click();

  const row = page.getByRole('row', { name: new RegExp(createdViewer.username) });
  await expect(row.getByText('DISABLED', { exact: true })).toBeVisible();
  await expect(row).toContainText('ADMIN');
});

test('backend last-enabled-ADMIN invariant is surfaced without frontend role inference', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/admin/users' && request.method() === 'GET') {
      return fulfillJson(route, [existingAdmin]);
    }
    if (url.pathname === `/api/v1/admin/users/${existingAdmin.id}` && request.method() === 'PUT') {
      return fulfillJson(route, { detail: 'At least one enabled ADMIN identity is required.' }, 409);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/users');
  await page.evaluate(() => {
    document.cookie = 'XSRF-TOKEN=identity-conflict-proof; Path=/; SameSite=Strict';
  });

  await page.getByRole('button', { name: `Edit identity ${existingAdmin.username}` }).click();
  await page.getByRole('checkbox', { name: 'Enabled' }).uncheck();
  await page.getByRole('button', { name: 'Save changes' }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toContainText('At least one enabled ADMIN identity is required.');
  await expect(page).toHaveURL(/\/users$/);
});
