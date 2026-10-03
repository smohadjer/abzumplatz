import { expect, Page, test } from '@playwright/test';

async function mockPublicApp(page: Page) {
  await page.route('**/api/clubs', route => route.fulfill({json: []}));
  await page.route('**/api/verifyAuth', route => route.fulfill({json: {error: 'Nicht angemeldet'}}));
}

test.describe('legal pages and registration consent', () => {
  test.beforeEach(async ({page}) => {
    await mockPublicApp(page);
  });

  test('privacy and terms pages are public and linked from the sidebar', async ({page}) => {
    await page.goto('/');

    await expect(page.locator('footer').getByRole('link', {name: /Impressum|Datenschutz|Nutzungsbedingungen/})).toHaveCount(0);
    await page.getByRole('button', {name: 'Menü öffnen'}).click();
    const sidebar = page.getByRole('dialog', {name: 'Weitere Seiten'});
    await expect(sidebar.getByRole('link', {name: 'Impressum'})).toHaveAttribute('href', '/impressum');
    await expect(sidebar.getByRole('link', {name: 'Datenschutz'})).toHaveAttribute('href', '/privacy');
    await expect(sidebar.getByRole('link', {name: 'Nutzungsbedingungen'})).toHaveAttribute('href', '/terms');

    await page.goto('/privacy');
    await expect(page.getByRole('heading', {level: 1, name: 'Datenschutzerklärung'})).toBeVisible();
    await expect(page).toHaveTitle('Datenschutzerklärung – abzumplatz');

    await page.goto('/terms');
    await expect(page.getByRole('heading', {level: 1, name: 'Nutzungsbedingungen'})).toBeVisible();
    await expect(page).toHaveTitle('Nutzungsbedingungen – abzumplatz');
  });

  test('a legal-page back button follows browser history', async ({page}) => {
    await page.goto('/');
    await page.getByRole('button', {name: 'Menü öffnen'}).click();
    await page.getByRole('dialog', {name: 'Weitere Seiten'}).getByRole('link', {name: 'Datenschutz'}).click();

    await expect(page).toHaveURL('/privacy');
    await page.getByRole('button', {name: 'Zurück'}).click();
    await expect(page).toHaveURL('/');
  });

  test('imprint links to the public contact form without publishing a telephone number', async ({page}) => {
    let submittedMessage: Record<string, unknown> | undefined;
    await page.route('**/api/auth?action=contact', async route => {
      submittedMessage = route.request().postDataJSON();
      await route.fulfill({json: {message: 'Vielen Dank. Ihre Nachricht wurde gesendet.'}});
    });

    await page.goto('/impressum');

    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(page.locator('form.contact-form')).toHaveCount(0);
    await page.getByRole('link', {name: 'Kontaktformular'}).click();
    await expect(page).toHaveURL('/support');
    await page.getByLabel('Name').fill('Petra Playwright');
    await page.getByLabel('E-Mail').fill('petra@example.com');
    await page.getByLabel('Nachricht').fill('Dies ist eine Testnachricht.');
    await page.getByRole('button', {name: 'Nachricht senden'}).click();

    await expect(page.getByRole('status')).toHaveText('Vielen Dank. Ihre Nachricht wurde gesendet.');
    expect(submittedMessage).toMatchObject({
      name: 'Petra Playwright',
      email: 'petra@example.com',
      message: 'Dies ist eine Testnachricht.',
      website: '',
    });
  });

  test('imprint loads the telephone number only for an authenticated user', async ({page}) => {
    await page.unroute('**/api/verifyAuth');
    await page.route('**/api/verifyAuth', route => route.fulfill({json: {
      _id: 'authenticated-user',
      first_name: 'Petra',
      last_name: 'Playwright',
      email: 'petra@example.com',
      role: 'player',
      status: 'active',
      club_id: '',
    }}));
    await page.route('**/api/auth?action=contact', route => route.fulfill({json: {phone: '+49 176 8826 9966'}}));

    await page.goto('/impressum');

    await expect(page.getByRole('link', {name: '+49 176 8826 9966'})).toHaveAttribute('href', 'tel:+4917688269966');
  });

  test('player registration requires unselected consent with legal links', async ({page}) => {
    await page.goto('/register/player');

    await expect(page.getByRole('checkbox')).not.toBeChecked();
    const consent = page.locator('.label--checkbox');
    const privacyLink = consent.getByRole('link', {name: 'Datenschutzerklärung'});
    const termsLink = consent.getByRole('link', {name: 'Nutzungsbedingungen'});
    await expect(privacyLink).toHaveAttribute('href', '/privacy');
    await expect(privacyLink).toHaveAttribute('target', '_blank');
    await expect(termsLink).toHaveAttribute('href', '/terms');
    await expect(termsLink).toHaveAttribute('target', '_blank');
    await expect(page.getByText('Mit Ihrer Registrierung und Nutzung dieser App')).toHaveCount(0);

    const firstNameInput = page.locator('input[name="first_name"]');
    await firstNameInput.fill('Carlos');
    const privacyPagePromise = page.waitForEvent('popup');
    await privacyLink.click();
    const privacyPage = await privacyPagePromise;
    await expect(privacyPage).toHaveURL('/privacy');
    await expect(page).toHaveURL('/register/player');
    await expect(firstNameInput).toHaveValue('Carlos');
    await privacyPage.close();
  });

  test('club registration uses the same required legal consent', async ({page}) => {
    await page.goto('/register/club');
    await page.locator('.register-club-plan-card--basic').getByRole('button', {name: 'Basic-Plan auswählen'}).click();

    await expect(page.getByRole('checkbox')).not.toBeChecked();
    const consent = page.locator('.label--checkbox');
    await expect(consent.getByRole('link', {name: 'Datenschutzerklärung'})).toHaveAttribute('href', '/privacy');
    await expect(consent.getByRole('link', {name: 'Datenschutzerklärung'})).toHaveAttribute('target', '_blank');
    await expect(consent.getByRole('link', {name: 'Nutzungsbedingungen'})).toHaveAttribute('href', '/terms');
    await expect(consent.getByRole('link', {name: 'Nutzungsbedingungen'})).toHaveAttribute('target', '_blank');
  });

  test('a player can open account deletion and submit their password', async ({page}) => {
    await page.unroute('**/api/verifyAuth');
    await page.route('**/api/verifyAuth', route => route.fulfill({json: {
      _id: '686f4d8dcad7fbea224a32c4',
      first_name: 'Petra',
      last_name: 'Playwright',
      email: 'petra@example.com',
      role: 'player',
      status: 'active',
      club_id: '',
    }}));
    let deletionBody: Record<string, unknown> | undefined;
    await page.route('**/api/auth?action=delete-account', async route => {
      deletionBody = route.request().postDataJSON();
      await route.fulfill({status: 401, json: {error: 'Das Passwort ist nicht korrekt.'}});
    });

    await page.goto('/');
    await page.getByRole('button', {name: 'Menü öffnen'}).click();
    await page.getByRole('button', {name: 'Konto löschen'}).click();
    const dialog = page.getByRole('dialog', {name: 'Konto löschen'});
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Aktuelles Passwort:').fill('wrong-password');
    page.once('dialog', confirmation => confirmation.accept());
    await dialog.getByRole('button', {name: 'Löschen bestätigen'}).click();

    await expect(dialog.getByRole('alert')).toHaveText('Das Passwort ist nicht korrekt.');
    expect(deletionBody).toEqual({password: 'wrong-password'});
  });
});
