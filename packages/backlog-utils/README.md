# @repo/backlog-utils

Internal package. Backlog API client wrapper built on [backlog-js](https://github.com/nulab/backlog-js).

- OAuth token auto-refresh on 401 responses
- Rate-limit error handling
- `getClient()` returns a ready-to-use `Backlog` instance
