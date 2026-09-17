import { expect, test } from '@playwright/test';
import type { CurrentPrincipal } from '../../src/api/types';
import { sourceFixture, sourceTestFixture } from './fixtures/api';
import { fulfillJson, rejectUnexpectedApi } from './support/http';
import { installMockEventSource, sseUsesCredentials, waitForSseSource } from './support/sse';

const adminViewerPrincipal: CurrentPrincipal = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  username: 'admin-viewer',
  identityType: 'HUMAN',
  roles: ['USER', 'VIEWER', 'ADMIN'],
};

const viewerPrincipal: CurrentPrincipal = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  username: 'viewer-only',
  identityType: 'HUMAN',
  roles: ['USER', 'VIEWER'],
};

const adminPrincipal: CurrentPrincipal = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  username: 'admin-only',
  identityType: 'HUMAN',
  roles: ['USER', 'ADMIN'],
};

test('unauthenticated deep links require login and logout sends CSRF proof', async ({ page }) => {
  let authenticated = false;
  let logoutCsrf: string | null = null;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/auth/me' && request.method() === 'GET') {
      return authenticated
        ? fulfillJson(route, adminViewerPrincipal)
        : fulfillJson(route, { detail: 'Authentication required' }, 401);
    }
    if (url.pathname === '/api/v1/auth/login' && request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({ username: 'admin-viewer', password: expect.any(String) });
      if (request.postDataJSON().password === 'wrong-password') {
        return fulfillJson(route, { detail: 'Invalid credentials' }, 401);
      }
      authenticated = true;
      return route.fulfill({ status: 200, body: '' });
    }
    if (url.pathname === '/api/v1/auth/logout' && request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({});
      logoutCsrf = request.headers()['x-csrf-token'] ?? null;
      authenticated = false;
      return route.fulfill({ status: 200, body: '' });
    }
    if (url.pathname === '/api/v1/admin/users' && request.method() === 'GET') {
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/users');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();

  await page.getByLabel('Username').fill('admin-viewer');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid username or password, or the account is disabled.');

  await page.getByLabel('Password').fill('correct-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Identity Administration' })).toBeVisible();
  await expect(page.getByText('admin-viewer', { exact: true })).toBeVisible();

  await page.evaluate(() => {
    document.cookie = 'XSRF-TOKEN=signed-csrf-fixture; Path=/; SameSite=Strict';
  });
  await page.getByRole('button', { name: 'Sign out' }).click();

  await expect.poll(() => logoutCsrf).toBe('signed-csrf-fixture');
  await expect(page).toHaveURL(/\/login$/);
});

test('viewer-only identities do not receive operational or diagnostic navigation', async ({ page }) => {
  await installMockEventSource(page, true);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/auth/me' && request.method() === 'GET') {
      return fulfillJson(route, viewerPrincipal);
    }
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      expect(url.searchParams.get('relevant')).toBe('true');
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/results');

  await expect(page.getByRole('link', { name: 'Results' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Sources' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Event Explorer' })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Results feed' })).toBeVisible();
  await expect(page.getByText('No relevant results match the current filters.')).toBeVisible();

  await page.goto('/sources');
  await expect(page.getByRole('heading', { level: 1, name: 'Access denied' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('does not have access');
});

test('ADMIN does not imply VIEWER and the dashboard avoids the Results boundary without that role', async ({ page }) => {
  let resultsRequested = false;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/auth/me' && request.method() === 'GET') {
      return fulfillJson(route, adminPrincipal);
    }
    if (url.pathname === '/api/v1/results') {
      resultsRequested = true;
      return fulfillJson(route, []);
    }
    if (
      request.method() === 'GET'
      && [
        '/api/v1/sources',
        '/api/v1/monitoring-profiles',
        '/api/v1/admin/collection-runs',
        '/api/v1/admin/analysis/items',
      ].includes(url.pathname)
    ) {
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Results' })).toHaveCount(0);
  await expect(page.getByText('Analyzed results', { exact: true })).toHaveCount(0);
  await expect.poll(() => resultsRequested).toBe(false);

  await page.goto('/results');
  await expect(page.getByRole('heading', { level: 1, name: 'Access denied' })).toBeVisible();
});

test('authenticated mutations send CSRF proof and SSE uses credentialed EventSource', async ({ page }) => {
  await installMockEventSource(page, true);
  let sourceTestCsrf: string | null = null;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/auth/me' && request.method() === 'GET') {
      return fulfillJson(route, adminViewerPrincipal);
    }
    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      return fulfillJson(route, [sourceFixture]);
    }
    if (url.pathname === `/api/v1/sources/${sourceFixture.id}/test` && request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({});
      sourceTestCsrf = request.headers()['x-csrf-token'] ?? null;
      return fulfillJson(route, sourceTestFixture);
    }
    if (url.pathname === '/api/v1/results' && request.method() === 'GET') {
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/sources');
  await page.evaluate(() => {
    document.cookie = 'XSRF-TOKEN=signed-mutation-proof; Path=/; SameSite=Strict';
  });
  await page.getByRole('button', { name: `Test source ${sourceFixture.name}` }).click();
  await expect.poll(() => sourceTestCsrf).toBe('signed-mutation-proof');

  await page.getByRole('link', { name: 'Results' }).click();
  await waitForSseSource(page, '/api/v1/results/stream');
  await expect.poll(() => sseUsesCredentials(page, '/api/v1/results/stream')).toBe(true);
});

test('protected request 401 returns the browser to login and 403 remains an authorization error', async ({ page }) => {
  let sourceStatus = 403;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/auth/me' && request.method() === 'GET') {
      return fulfillJson(route, adminViewerPrincipal);
    }
    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      return fulfillJson(route, {}, sourceStatus);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/sources');
  await expect(page.getByRole('alert')).toContainText('You do not have permission to perform this action.');

  sourceStatus = 401;
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
});
