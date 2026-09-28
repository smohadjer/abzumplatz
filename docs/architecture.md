# Architecture

This document is the high-level entry point for the application's technical documentation. Feature-specific data models, APIs, workflows, and business rules live in dedicated documents under `docs/`.

## Application Structure

- The frontend is a React and TypeScript application built with Vite.
- Client-side navigation uses React Router.
- Shared client state uses Redux Toolkit; feature state must be scoped to the authenticated user and club where applicable.
- Server endpoints live under `api/` and are deployed as Vercel functions.
- MongoDB is the source of truth for persisted application and authorization data.

## Frontend and Backend Boundaries

The client is responsible for presentation, navigation, form state, and responsive interaction. The server is responsible for authentication, authorization, business-rule validation, club isolation, and persisted state changes.

Client state and form controls are never treated as authorization. Protected endpoints reload the current database records needed for their decisions.

## Documentation Map

- [Authentication and authorization](authentication.md)
- [Clubs](clubs.md)
- [In-app notifications](notifications.md)
- [Plans and billing](plans.md)
- [Reservations](reservations.md)
- [Testing](testing.md)
- [Tournaments](tournaments.md)

Application assumptions should be documented in the relevant feature guide, especially when they affect authorization, status handling, data defaults, lifecycle behavior, or other business rules that would otherwise remain implicit in code.
