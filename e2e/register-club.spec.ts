import { expect, Page, test } from '@playwright/test';

type PlanType = 'basic' | 'pro';

async function openClubRegistration(page: Page, plan: PlanType) {
  await page.route('**/api/clubs', route => route.fulfill({ json: [] }));
  await page.route('**/api/verifyAuth', route => route.fulfill({ json: { error: 'Nicht angemeldet' } }));

  await page.goto('/register/club');
  const planCard = page.locator(`.register-club-plan-card--${plan}`);
  await planCard.getByRole('button', { name: 'Plan auswählen' }).click();
  await expect(page.getByText(`Gewählter Plan: ${plan === 'basic' ? 'Basic' : 'Pro'}`)).toBeVisible();
}

async function fillCommonRegistrationFields(page: Page, suffix: string) {
  await page.locator('input[name="first_name"]').fill('Petra');
  await page.locator('input[name="last_name"]').fill('Playwright');
  await page.locator('input[name="email"]').fill(`petra.${suffix}@example.com`);
  await page.locator('input[name="password"]').fill('Password1!');
  await page.locator('input[name="name"]').fill(`TC Playwright ${suffix}`);
  await page.getByRole('checkbox').check();
}

test('a club can register with the Basic plan without an address', async ({ page }) => {
  let submittedRegistration: Record<string, unknown> | undefined;
  await page.route('**/api/signup-club', async route => {
    submittedRegistration = route.request().postDataJSON();
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.fulfill({
      status: 201,
      json: {
        club: {
          _id: 'basic-club-id',
          name: 'TC Playwright basic',
          access_plan_type: 'basic',
          next_plan_type: 'basic',
          courts: [{ status: 'active' }],
        },
      },
    });
  });

  await openClubRegistration(page, 'basic');

  await expect(page.locator('[name="address_line1"]')).toHaveCount(0);
  await expect(page.locator('[name="postal_code"]')).toHaveCount(0);
  await expect(page.locator('[name="city"]')).toHaveCount(0);
  await fillCommonRegistrationFields(page, 'basic');
  await page.getByRole('button', { name: 'Verein Registrieren' }).click();

  await expect(page.getByRole('status', { name: 'Registrierung wird verarbeitet' })).toBeVisible();
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { name: 'Einloggen' })).toBeVisible();
  await expect(page.getByText('Ihr Verein wurde erfolgreich registriert. Melden Sie sich jetzt an, um ihn einzurichten.')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toHaveValue('petra.basic@example.com');
  await expect(page.locator('input[name="password"]')).toBeFocused();
  expect(submittedRegistration).toMatchObject({
    first_name: 'Petra',
    last_name: 'Playwright',
    email: 'petra.basic@example.com',
    password: 'Password1!',
    privacy: 'agree',
    name: 'TC Playwright basic',
    plan_type: 'basic',
  });
  expect(submittedRegistration).not.toHaveProperty('address_line1');
  expect(submittedRegistration).not.toHaveProperty('postal_code');
  expect(submittedRegistration).not.toHaveProperty('city');
  expect(submittedRegistration).not.toHaveProperty('country');
});

test('a club registering with the Pro plan submits a complete billing address', async ({ page }) => {
  let submittedRegistration: Record<string, unknown> | undefined;
  await page.route('**/api/signup-club', async route => {
    submittedRegistration = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      json: {
        club: {
          _id: 'pro-club-id',
          name: 'TC Playwright pro',
          access_plan_type: 'pro',
          next_plan_type: 'pro',
          courts: [{ status: 'active' }],
        },
      },
    });
  });

  await openClubRegistration(page, 'pro');

  await expect(page.getByText('Für die Rechnungsstellung erforderlich.')).toBeVisible();
  await fillCommonRegistrationFields(page, 'pro');
  await page.locator('input[name="address_line1"]').fill('Testweg 12');
  await page.locator('input[name="postal_code"]').fill('79100');
  await page.locator('input[name="city"]').fill('Freiburg');
  await page.getByRole('button', { name: 'Verein Registrieren' }).click();

  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('heading', { name: 'Einloggen' })).toBeVisible();
  await expect(page.getByText('Ihr Verein wurde erfolgreich registriert. Melden Sie sich jetzt an, um ihn einzurichten.')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toHaveValue('petra.pro@example.com');
  await expect(page.locator('input[name="password"]')).toBeFocused();
  expect(submittedRegistration).toMatchObject({
    first_name: 'Petra',
    last_name: 'Playwright',
    email: 'petra.pro@example.com',
    password: 'Password1!',
    privacy: 'agree',
    name: 'TC Playwright pro',
    address_line1: 'Testweg 12',
    postal_code: '79100',
    city: 'Freiburg',
    country: 'Deutschland',
    plan_type: 'pro',
  });
});

test('a club invitation link preselects the invited club for player registration', async ({ page }) => {
  await page.route('**/api/clubs', route => route.fulfill({
    json: [
      {_id: 'invited-club-id', name: 'TC Einladung'},
      {_id: 'other-club-id', name: 'TC Andere'},
    ],
  }));
  await page.route('**/api/verifyAuth', route => route.fulfill({json: {error: 'Nicht angemeldet'}}));

  await page.goto('/register/player?club=invited-club-id');

  await expect(page.locator('select[name="club_id"]')).toHaveValue('invited-club-id');
  await expect(page.getByText('Dieser Verein wurde durch Ihren Einladungslink vorausgewählt.')).toBeVisible();
});
