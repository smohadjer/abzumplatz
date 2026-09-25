import { expect, test } from '@playwright/test';
import { admin, club, player } from './support/test-data';

test('a player can delete their reservation', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2030-06-15T07:00:00Z') });

  let reservations: Array<Record<string, unknown>> = [{
    _id: 'reservation-1',
    user_id: player._id,
    club_id: club._id,
    court_nums: ['1'],
    start_time: 10,
    end_time: 12,
    date: '2030-06-15',
    label: 'Paula Playwright',
    recurring: false,
    timestamp: '2030-06-15T06:30:00.000Z',
  }];
  let submittedDeletion: Record<string, unknown> | undefined;

  await page.route('**/api/clubs', route => route.fulfill({ json: [club] }));
  await page.route('**/api/verifyAuth', route => route.fulfill({ json: player }));
  await page.route('**/api/users?**', route => route.fulfill({ json: [player, admin] }));
  await page.route('**/api/reservations', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: reservations });
      return;
    }

    submittedDeletion = route.request().postDataJSON();
    reservations = [];
    await route.fulfill({ json: { data: reservations } });
  });

  await page.goto('/reservations');
  await page.getByLabel('Platz 1, 10:00 Uhr, reserviert von Paula Playwright').click();
  await page.getByRole('checkbox', { name: 'Reservierung löschen' }).check();
  await page.getByRole('button', { name: 'Reservierung löschen' }).click();

  expect(submittedDeletion).toEqual({
    reservation_id: 'reservation-1',
    label: 'Paula Playwright',
    date: '2030-06-15',
    start_time: '10',
    court_nums: '1',
    duration: '2',
    delete: 'true',
    delete_date: '2030-06-15',
    delete_type: 'all',
  });
  await expect(page.getByLabel('Platz 1, 10:00 Uhr, frei')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('reservation-deleted.png'),
    fullPage: true,
  });
});

test('a player can delete only the displayed occurrence of a recurring reservation from bookings', async ({ page }) => {
  await page.clock.install({ time: new Date('2030-06-15T07:00:00Z') });

  let reservations: Array<Record<string, unknown>> = [{
    _id: 'recurring-reservation-1',
    user_id: player._id,
    club_id: club._id,
    court_nums: ['2'],
    start_time: 10,
    end_time: 11,
    date: '2030-06-08',
    label: 'Training',
    recurring: true,
    timestamp: '2030-06-01T06:30:00.000Z',
  }];
  let submittedDeletion: Record<string, unknown> | undefined;

  await page.route('**/api/clubs', route => route.fulfill({ json: [club] }));
  await page.route('**/api/verifyAuth', route => route.fulfill({ json: player }));
  await page.route('**/api/users?**', route => route.fulfill({ json: [player, admin] }));
  await page.route('**/api/reservations', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: reservations });
      return;
    }

    submittedDeletion = route.request().postDataJSON();
    reservations = [{...reservations[0], deleted_dates: ['2030-06-15']}];
    await route.fulfill({ json: { data: reservations } });
  });

  await page.goto('/bookings');
  await page.getByRole('button', { name: 'Stornieren', exact: true }).click();
  await expect(page.getByText('Reservierung am 15.6.2030 wirklich stornieren?')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Nur diesen Termin am 15.6.2030' })).toBeChecked();
  await page.getByRole('button', { name: 'Stornieren bestätigen' }).click();

  expect(submittedDeletion).toEqual({
    reservation_id: 'recurring-reservation-1',
    delete: 'true',
    delete_type: 'once',
    date: '2030-06-15',
  });
  await expect(page.getByText(/22\.6\.2030/)).toBeVisible();
});
