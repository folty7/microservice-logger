# React Frontend

Browser client for the logging platform. It provides a login screen, stores the Feathers JWT access token, protects dashboard routes, and displays log records fetched through the Sails API gateway.

## Responsibilities

- Authenticate users through the gateway route `/api/auth`.
- Store the returned JWT in `localStorage`.
- Keep authentication state synchronized across browser tabs.
- Protect dashboard routes with React Router.
- Fetch logs from `/api/logs`.
- Refresh dashboard log data every 10 seconds.
- Clear local auth state on `401` responses.

## Stack

- React 19
- TypeScript
- Vite
- React Router DOM 7
- Tailwind CSS 4
- shadcn/Radix-style component structure
- Phosphor icon configuration

## Application Structure

```text
src/
  App.tsx
  main.tsx
  context/
    AuthContext.tsx
  pages/
    Login.tsx
    Dashboard.tsx
  components/
    layout/
      ProtectedRoute.tsx
    ui/
      button.tsx
      card.tsx
      input.tsx
      label.tsx
      table.tsx
  lib/
    utils.ts
```

## Routing

| Route | Component | Access |
| --- | --- | --- |
| `/login` | `Login` | Public; redirects to `/` when authenticated |
| `/` | `Dashboard` | Requires JWT |
| `*` | Redirect | Redirects to `/` |

Protected routing is handled by `components/layout/ProtectedRoute.tsx`.

## API Integration

Vite proxies browser requests from `/api` to the Sails API gateway:

```ts
proxy: {
  '/api': {
    target: 'http://sails-api:8080',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

The login flow posts:

```json
{
  "strategy": "local",
  "email": "user@example.com",
  "password": "password"
}
```

Successful responses are expected to contain `accessToken`.

Log requests send:

```http
Authorization: Bearer <token>
```

The dashboard currently queries:

```text
/api/logs?$sort[createdAt]=-1
```

## Development

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build
npm run lint
npm run preview
```

## Docker

The frontend is built from `node:22-alpine` and runs the Vite dev server on port `5173`. Docker Compose mounts the source directory into `/app` and keeps container `node_modules` isolated with an anonymous volume.

## Notes

- Auth state is intentionally lightweight and kept in React context.
- Server state is fetched directly with `fetch`; no client-side data cache library is configured.
- OAuth buttons in the login page are placeholders and do not currently start an OAuth redirect.
