import { expect, test } from '@playwright/test';
import { club, player } from './support/test-data';

test('a player can save birth year and sex in their profile', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2030-06-15T07:00:00Z') });

  let submittedProfile: Record<string, unknown> | undefined;

  await page.route('**/api/clubs', route => route.fulfill({ json: [club] }));
  await page.route('**/api/verifyAuth', route => route.fulfill({ json: player }));
  await page.route('**/api/users', async route => {
    if (route.request().method() !== 'PATCH') {
      await route.fallback();
      return;
    }

    submittedProfile = route.request().postDataJSON();
    await route.fulfill({
      json: {
        first_name: player.first_name,
        last_name: player.last_name,
        birth_year: 1990,
        sex: 'female',
      },
    });
  });

  await page.goto('/profile/edit');
  await page.getByLabel('Geburtsjahr:').fill('1990');
  await page.getByLabel('Geschlecht:').selectOption('female');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(page).toHaveURL('/profile');
  expect(submittedProfile).toEqual({
    first_name: 'Paula',
    last_name: 'Playwright',
    birth_year: 1990,
    sex: 'female',
  });
  await expect(page.getByRole('row', { name: 'Geburtsjahr 1990' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Alter 40 Jahre (im laufenden Jahr)' })).toBeVisible();
  await expect(page.getByRole('row', { name: 'Geschlecht Weiblich' })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('profile-updated.png'),
    fullPage: true,
  });
});
