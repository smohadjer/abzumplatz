import { expect, test } from '@playwright/test';
import { admin, club, player } from './support/test-data';

test('a player can create a reservation', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2030-06-15T07:00:00Z') });

  let reservations: Array<Record<string, unknown>> = [];
  let submittedReservation: Record<string, unknown> | undefined;

  await page.route('**/api/clubs', route => route.fulfill({ json: [club] }));
  await page.route('**/api/verifyAuth', route => route.fulfill({ json: player }));
  await page.route('**/api/users?**', route => route.fulfill({
    json: [player, admin],
  }));
  await page.route('**/api/reservations', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: reservations });
      return;
    }

    submittedReservation = route.request().postDataJSON();
    reservations = [{
      _id: 'reservation-1',
      user_id: player._id,
      club_id: club._id,
      ...submittedReservation,
      timestamp: '2030-06-15T07:01:00.000Z',
    }];
    await route.fulfill({ json: { data: reservations } });
  });

  await page.goto('/reservations');

  await expect(page.getByLabel('Platz 1, 10:00 Uhr, frei')).toBeVisible();
  await page.getByLabel('Platz 1, 10:00 Uhr, frei').click();
  await page.getByLabel('Dauer:').selectOption('2');
  await page.getByRole('button', { name: 'Reservieren' }).click();

  await expect(page.getByRole('heading', { name: 'Reservierung erstellt' })).toBeVisible();
  await expect(page.getByText('Platz 1 am 15.6.2030 von 10:00 bis 12:00 Uhr.')).toBeVisible();
  expect(submittedReservation).toEqual({
    court_nums: ['1'],
    start_time: 10,
    end_time: 12,
    date: '2030-06-15',
    label: 'Paula Playwright',
    recurring: false,
  });

  await page.getByRole('button', { name: 'X' }).click();
  await expect(page.getByLabel('Platz 1, 10:00 Uhr, reserviert von Paula Playwright')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('reservation-created.png'),
    fullPage: true,
  });
});
