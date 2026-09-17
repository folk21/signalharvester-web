import type { Route } from '@playwright/test';
import type { CurrentPrincipal } from '../../../src/api/types';

export const defaultAdminPrincipal: CurrentPrincipal = {
  id: '99999999-9999-4999-8999-999999999999',
  username: 'browser-admin',
  identityType: 'HUMAN',
  roles: ['USER', 'VIEWER', 'ADMIN'],
};

export async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/** Handles the shared authenticated bootstrap before rejecting any other unrecognized API call. */
export async function rejectUnexpectedApi(route: Route): Promise<void> {
  const request = route.request();
  const url = new URL(request.url());
  if (url.pathname === '/api/v1/auth/me' && request.method() === 'GET') {
    await fulfillJson(route, defaultAdminPrincipal);
    return;
  }

  await route.abort('failed');
  throw new Error(`Unexpected API request: ${request.method()} ${request.url()}`);
}
