import { expect, test } from '@playwright/test';
import { admin, club, player } from './support/test-data';

test('a player cannot edit or delete a past reservation', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2030-06-15T12:00:00Z') });

  const reservations = [{
    _id: 'past-reservation-1',
    user_id: player._id,
    club_id: club._id,
    court_nums: ['1'],
    start_time: 10,
    end_time: 11,
    date: '2030-06-15',
    label: 'Paula Playwright',
    recurring: false,
    timestamp: '2030-06-15T06:30:00.000Z',
  }];
  let mutationRequests = 0;

  await page.route('**/api/clubs', route => route.fulfill({ json: [club] }));
  await page.route('**/api/verifyAuth', route => route.fulfill({ json: player }));
  await page.route('**/api/users?**', route => route.fulfill({ json: [player, admin] }));
  await page.route('**/api/reservations', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: reservations });
      return;
    }

    mutationRequests += 1;
    await route.fulfill({ status: 500, json: { error: 'Unexpected mutation request' } });
  });

  await page.goto('/reservations');
  const pastReservation = page.getByLabel('Platz 1, 10:00 Uhr, reserviert von Paula Playwright');
  await expect(pastReservation).toHaveClass(/past/);
  await pastReservation.click();

  await expect(page.locator('.lightbox')).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: 'Reservierung löschen' })).toHaveCount(0);
  expect(mutationRequests).toBe(0);
  await page.screenshot({
    path: testInfo.outputPath('past-reservation-blocked.png'),
    fullPage: true,
  });
});
