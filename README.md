# Apollo NewRelic Extension 2

Creates a newrelic transaction with associated custom attributes on each graphql request/response.
For use with Apollo Server's experimental extensions API only available with Apollo Server >= 2.x.

This differs from [Apollo NewRelic Extension](https://github.com/localshred/apollo-newrelic-extension) in that it falls back on a (basic) heuristic when a client fails to provide an operation name for their request, like:

```graphql
query {
  someNeatData {
    id
    name
  }
}
```

Instead of seeing this as `/graphql(undefined)` in NewRelic, this extension will display it as `/graphql(someNeatData(...))`. It's unfortunately pretty common that clients will fail to provide an operation name, which is why this lib exists.

# Usage

1. `yarn add apollo-newrelic-extension-2`
2. Enable tracing in your `ApolloServer` configuration.
3. Connect an extension instance to the `ApolloServer` configuration.

## Example

```javascript
const express = require('express')
const { ApolloServer } = require('apollo-server-express')
const ApolloNewrelicExtension = require('apollo-newrelic-extension-2')
const typeDefs = require('./typeDefs')
const resolvers = require('./resolvers')

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // ...additional configuration...

  // Thunk for creating the newrelic extension
  extensions: [() => new ApolloNewrelicExtension()],

  // Be sure to enable tracing
  tracing: true,
})

const app = express()
server.applyMiddleware({ app })

app.listen(3000, () => console.log('Server listening on port 3000'))
```

# Credits

This lib is forked from [`apollo-newrelic-extension`](https://github.com/localshred/apollo-newrelic-extension).

Special thanks to [ddombrow](https://github.com/ddombrow) for [this gist](https://gist.github.com/ddombrow/fe8d3765e7971001ec7af426eb9a7a6f).
