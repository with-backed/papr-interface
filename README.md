# papr-interface

![backed](/public/logos/backed-bunny.png 'backed')

## Developing

1. Install all deps by running `yarn`
2. Run in dev mode with `yarn dev`, which will also build graphql and abi type definitions.

## Testing

- Run `yarn test` to run the jest test suite
- Run `yarn test-coverage` to run the test suite and also generate a coverage report

## Configuration

Much of the app is driven by token-specific config objects in `lib/config.ts`. These values are shipped to the client.

There are also some environment variables that are not included in the config for one reason or another:

- NEXT_PUBLIC_SENTRY_DSN
  - Key used for reporting errors to a project on [sentry.io](https://sentry.io)
- NEXT_PUBLIC_ENV
  - `preview` or `production` (in practice, all non `production` values are treated as `preview`)
  - this was originally used to change the allowed list of chains (e.g., allow goerli in dev), however both lists of chains are identical at this time
- NEXT_PUBLIC_CENTER_KEY
  - API key for [center.app](https://center.app/api/)
- NEXT_PUBLIC_LANDING_PAGE_HEADER
  - Vestigial remnant of a time from when the header with links into the app was blocked. This should always be `true`, and the checks for it could be removed so that the header always displays.
- NEXT_PUBLIC_ALCHEMY_KEY
  - API key for [alchemy.com](https://www.alchemy.com/)
- NEXT_PUBLIC_QUOTER
  - address of quoter contract
- NEXT_PUBLIC_PIRSCH_CODE
  - API key for [pirsch.io](https://pirsch.io/)
- NEXT_PUBLIC_TWABS_GRAPHQL_TOKEN
  - used to access Hasura DB that keeps track of time weighted average bids for collections
  - this is an implementation detail that an alternate way of tracking TWABs may not need