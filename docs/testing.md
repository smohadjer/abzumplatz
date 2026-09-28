# Testing

## End-to-end tests

The Playwright suite starts the Vite app and uses deterministic API fixtures, so it does not need a local database or test account.

Install the browser once, then run the tests:

```bash
npx playwright install chromium
npm run test:e2e
```

For Playwright's interactive test runner, use:

```bash
npm run test:e2e:ui
```

## HTML report

A normal local run creates an HTML report in `playwright-report/`. Open the most recent report with:

```bash
npx playwright show-report
```

This starts a local report viewer containing the result and duration of every test, its steps, errors, and available artifacts. The report directory is generated and is not committed to Git.

Passing `--reporter=line` or another reporter on the command line overrides the configured HTML reporter, so that run will not generate the HTML report.

## Screenshots

Reservation tests save screenshots under their individual directories in `test-results/`:

- `reservation-created.png` shows the reservation on the calendar after the confirmation popup is closed.
- `reservation-deleted.png` shows the available slot after deletion.
- `past-reservation-blocked.png` shows a past reservation that a normal player cannot edit or delete.
- `profile-updated.png` shows the saved birth year, calculated age, and sex on the profile page.

To list all screenshots from the latest run:

```bash
find test-results -name '*.png' -print
```

The `test-results/` directory is cleared when a new Playwright run starts. Copy an artifact elsewhere if it needs to be retained. This directory is not committed to Git.

## Failure details and traces

When a test fails, the terminal output identifies its artifact directory under `test-results/`. Playwright may also create an `error-context.md` file there with a snapshot of the page at the point of failure.

The configuration records a trace on the first retry in CI. To record traces for a local run, use:

```bash
npm run test:e2e -- --trace on
```

Open a generated trace with:

```bash
npx playwright show-trace path/to/trace.zip
```

The trace viewer provides a timeline with screenshots, DOM snapshots, network requests, console output, and the actions Playwright performed.
