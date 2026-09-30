import { expect, test } from '@playwright/test';

test('a player can register for a club from an invitation link', async ({page}) => {
  const invitedClubId = '507f1f77bcf86cd799439011';
  let submittedRegistration: Record<string, unknown> | undefined;

  await page.route('**/api/clubs', route => route.fulfill({
    json: [
      {_id: invitedClubId, name: 'TC Einladung'},
      {_id: '507f1f77bcf86cd799439012', name: 'TC Andere'},
    ],
  }));
  await page.route('**/api/verifyAuth', route => route.fulfill({
    json: {error: 'Nicht angemeldet'},
  }));
  await page.route('**/api/signup', async route => {
    submittedRegistration = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      json: {message: 'User Petra Playwright is registered'},
    });
  });

  await page.goto(`/register/player?club=${invitedClubId}`);

  await expect(page.locator('select[name="club_id"]')).toHaveValue(invitedClubId);
  await page.locator('input[name="first_name"]').fill('Petra');
  await page.locator('input[name="last_name"]').fill('Playwright');
  await page.locator('input[name="email"]').fill('petra.player@example.com');
  await page.locator('input[name="password"]').fill('Password1!');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', {name: 'Registrieren'}).click();

  await expect(page).toHaveURL('/login');
  expect(submittedRegistration).toEqual({
    first_name: 'Petra',
    last_name: 'Playwright',
    email: 'petra.player@example.com',
    password: 'Password1!',
    club_id: invitedClubId,
    privacy: 'agree',
  });
});
