import { expect, test } from '@playwright/test';
import { monitoringProfileFixture, sourceFixture } from './fixtures/api';
import { fulfillJson, rejectUnexpectedApi } from './support/http';

test('application shell exposes a keyboard skip link and stable landmarks', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/sources');

  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('configuration tables expose named actions and restore keyboard focus after editing', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      return fulfillJson(route, [sourceFixture]);
    }
    if (url.pathname === '/api/v1/monitoring-profiles' && request.method() === 'GET') {
      return fulfillJson(route, [monitoringProfileFixture]);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/sources');

  await expect(page.getByRole('table', { name: 'Configured sources' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Source configuration' })).toBeVisible();
  await expect(page.getByLabel('Name')).toBeVisible();

  const editSource = page.getByRole('button', { name: `Edit source ${sourceFixture.name}` });
  await editSource.click();
  await expect(page.getByLabel('Name')).toBeFocused();
  await expect(page.getByRole('button', { name: `Delete source ${sourceFixture.name}` })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(editSource).toBeFocused();

  await page.getByRole('button', { name: 'New source' }).click();
  await expect(page.getByLabel('Name')).toBeFocused();

  await page.goto('/profiles');

  await expect(page.getByRole('table', { name: 'Configured monitoring profiles' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Monitoring profile configuration' })).toBeVisible();

  const editProfile = page.getByRole('button', {
    name: `Edit monitoring profile ${monitoringProfileFixture.name}`,
  });
  await editProfile.click();
  await expect(page.getByLabel('Name')).toBeFocused();
  await expect(
    page.getByRole('button', { name: `Delete monitoring profile ${monitoringProfileFixture.name}` }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(editProfile).toBeFocused();
});

test('client-side configuration validation is exposed as an alert', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/v1/sources' && request.method() === 'GET') {
      return fulfillJson(route, []);
    }
    return rejectUnexpectedApi(route);
  });

  await page.goto('/sources');
  await page.getByRole('button', { name: 'Create source' }).click();

  const validationAlert = page.getByRole('alert');
  await expect(validationAlert).toHaveText('Name is required.');
  await expect(page.getByRole('form', { name: 'Source configuration' })).toHaveAttribute(
    'aria-describedby',
    'source-form-validation-error',
  );
});
