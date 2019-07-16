const R = require('ramda')
const { GraphQLExtension } = require('graphql-extensions')
const newrelic = require('newrelic')
const fieldTraceSummary = require('./field-trace-summary')

const errorCount = R.pipe(R.propOr([], 'errors'), R.length)

class NewRelicExtension extends GraphQLExtension {
  requestDidStart({
    queryString,
    operationName,
    variables,
    persistedQueryHit,
  }) {
    const queryMatch = queryString.match(/(\{\n?\s+?)([a-z]+)(\(.*)/i)
    const queryName = queryMatch ? queryMatch[2] + '(...)' : ''
    const transactionName = operationName || queryName
    newrelic.setTransactionName(`graphql(${transactionName})`)
    newrelic.addCustomAttribute('gqlQuery', queryString)
    newrelic.addCustomAttribute('gqlVars', JSON.stringify(variables))
    newrelic.addCustomAttribute('persistedQueryHit', persistedQueryHit)
  }

  willSendResponse({ graphqlResponse }) {
    const tracingSummary = R.pipe(
      R.pathOr([], ['extensions', 'tracing']),
      fieldTraceSummary,
    )(graphqlResponse)
    newrelic.addCustomAttribute('traceSummary', tracingSummary)
    newrelic.addCustomAttribute('errorCount', errorCount(graphqlResponse))
  }
}

module.exports = NewRelicExtension
