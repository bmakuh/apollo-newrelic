# `apollo-newrelic`

There are two ways to use this library: one way is to instrument your HTTP requests against Apollo Server as transactions, and the other way is to mark top-level fields on Queries and Mutations as transactions. The former option is a little bit simpler to integrate, but gives less precise data in NR. The latter option gives more granular data but requires a little more setup.

## Option 1: Marking requests as transactions

Given the following query:

```graphql
query {
  blogPost(id: "12345") {
    id
    name
  }
  author(id: "abcde") {
    title
    avatarUrl
  }
}
```

It will display in NR as `/graphql(blogPost(...))` because the client did not provide an operation name, so it's simply using the name of the first field to try to identify the request. If an operation name is provided, that will be used.

```graphql
query Test {
  # the query here
}
```

Will display as `/graphql(Test)`

### Usage

1. `yarn add apollo-newrelic`
2. Enable tracing in your `ApolloServer` configuration.
3. Connect an extension instance to the `ApolloServer` configuration.

### Example

```javascript
const express = require('express')
const { ApolloServer } = require('apollo-server-express')
const ApolloNewRelic = require('apollo-newrelic')
const typeDefs = require('./typeDefs')
const resolvers = require('./resolvers')

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // ...additional configuration...

  // Thunk for creating the newrelic extension
  extensions: [() => new ApolloNewRelic()],

  // Be sure to enable tracing
  tracing: true,
})

const app = express()
server.applyMiddleware({ app })

app.listen(3000, () => console.log('Server listening on port 3000'))
```

## Option 2: Marking top-level fields as transactions

Given the following query and mutation:

```graphql
query {
  blogPost(id: "12345") {
    id
    name
  }
  author(id: "abcde") {
    title
    avatarUrl
  }
}

mutation {
  createBlogPost(title: "GraphQL is super neat") {
    id
    name
  }
}
```

It will display in NewRelic as:

- `/Query: blogPost`
- `/Query: author`
- `/Mutation: createBlogPost`

This is nice for a few of reasons. First, the two top-level fields in the query have different tracing profiles, and it's nice to see them broken out as such in NewRelic. Second, it's also nice to see a clear differentiation between queries and mutations. Third, it's nice not to have to rely on the client providing an operation name for their query or mutation in order to have granular data in NewRelic.

### Usage

1. `yarn add apollo-newrelic`
2. Mark your exported resolvers as transactions

### Example

```javascript
const express = require('express')
const { ApolloServer, makeExecutableSchema } = require('apollo-server-express')
const { markResolversAsTransactions } = require('apollo-newrelic')
// wrap the exported resolvers object here
const typeDefs = require('./typeDefs')
const resolvers = markResolversAsTransactions({
  Query: {
    blogPost: (parent, args, context) => {
      return Db.getBlogPost()
    },
    author: (parent, args, context) => {
      return Db.getAuthor()
    },
  },
  Mutation: {
    createBlogPost: (parent, args, context) => {
      return Db.createBlogPost()
    },
  },
})

const server = new ApolloServer({
  typeDefs,
  resolvers: makeExecutableSchema(resolvers),
})

const app = express()
server.applyMiddleware({ app })

app.listen(3000, () => console.log('Server listening on port 3000'))
```

## Credits

This lib is forked from [`apollo-newrelic-extension`](https://github.com/localshred/apollo-newrelic-extension).

Special thanks to [ddombrow](https://github.com/ddombrow) for [this gist](https://gist.github.com/ddombrow/fe8d3765e7971001ec7af426eb9a7a6f).
