import type { Route } from '@playwright/test';

export async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function rejectUnexpectedApi(route: Route): Promise<never> {
  const request = route.request();
  await route.abort('failed');
  throw new Error(`Unexpected API request: ${request.method()} ${request.url()}`);
}
