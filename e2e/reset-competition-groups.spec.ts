import { expect, test } from '@playwright/test';
import { admin, club } from './support/test-data';

const defaultGroupNames = [
  'Herren Einzel',
  'Damen Einzel',
  'Junioren U18',
  'Juniorinnen U18',
  'Junioren U15',
  'Juniorinnen U15',
  'Junioren U12',
  'Juniorinnen U12',
  'Herren 30',
  'Damen 30',
  'Herren 40',
  'Damen 40',
  'Herren 50',
  'Damen 50',
  'Herren 60',
  'Damen 60',
  'Herren Doppel',
  'Damen Doppel',
  'Mixed Doppel',
];

const defaultGroups = defaultGroupNames.map((name, index) => ({
  _id: `default-group-${index + 1}`,
  club_id: club._id,
  name,
  competition_type: {
    id: name.includes('Doppel') ? 'double' : 'single',
    name: name.includes('Doppel') ? 'Doppel' : 'Einzel',
  },
}));

test('an admin can reset all competition groups to the defaults', async ({page}) => {
  const adminUser = {
    ...admin,
    email: 'ada@example.test',
    club_id: club._id,
    status: 'active',
  };
  const customGroup = {
    _id: 'custom-group-1',
    club_id: club._id,
    name: 'Eigene Hobbyrunde',
    competition_type: {id: 'single', name: 'Einzel'},
  };
  let submittedReset: Record<string, unknown> | undefined;

  await page.route('**/api/clubs', route => route.fulfill({json: [club]}));
  await page.route('**/api/verifyAuth', route => route.fulfill({json: adminUser}));
  await page.route('**/api/tournaments', route => route.fulfill({json: []}));
  await page.route('**/api/competition-groups', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({json: [customGroup, defaultGroups[0]]});
      return;
    }

    submittedReset = route.request().postDataJSON();
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.fulfill({
      json: {
        reset_count: defaultGroups.length,
        groups: defaultGroups,
      },
    });
  });

  await page.goto('/admin/competition-groups');
  await expect(page.getByText(customGroup.name, {exact: true})).toBeVisible();

  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('Alle eigenen und geänderten Konkurrenzen werden gelöscht');
    await dialog.accept();
  });
  await page.getByRole('button', {name: 'Alle Konkurrenzen zurücksetzen'}).click();

  await expect(page.getByRole('button', {name: 'Wird zurückgesetzt...'})).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText('19 Standardkonkurrenzen wurden wiederhergestellt.');
  expect(submittedReset).toEqual({action: 'reset_defaults'});
  await expect(page.getByText(customGroup.name, {exact: true})).toHaveCount(0);
  for (const name of defaultGroupNames) {
    await expect(page.getByText(name, {exact: true})).toBeVisible();
  }
});
