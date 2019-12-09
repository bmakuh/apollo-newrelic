import { GraphQLExtension } from 'graphql-extensions'
import newrelic from 'newrelic'
import fieldTraceSummary from './field-trace-summary'

const errorCount = (errors: readonly any[] = []) => errors.length

class NewRelicExtension extends GraphQLExtension {
  // requestDidStart: GraphQLExtension['requestDidStart'] = ({
  //   queryString = '',
  //   operationName,
  //   persistedQueryHit = false,
  // }) => {
  //   const queryMatch = queryString.match(/(\{\n?\s+?)([a-z]+)(\(.*)/i)
  //   const queryName = queryMatch ? queryMatch[2] + '(...)' : ''
  //   const transactionName = operationName || queryName

  //   newrelic.newrelic.setTransactionName(`graphql(${transactionName})`)
  //   newrelic.addCustomAttributes({
  //     gqlQuery: queryString,
  //     persistedQueryHit,
  //   })
  // }

  willResolveField: GraphQLExtension['willResolveField'] = (
    _source,
    _args,
    _context,
    info,
  ) => {
    return () => {
      if (info.parentType.name !== 'Query') {
        return
      }

      const transactionName = `${info.operation.operation} ${info.fieldName}: ${info.returnType}`
      newrelic.setTransactionName(transactionName)
    }
  }

  willSendResponse: GraphQLExtension['willSendResponse'] = ({
    graphqlResponse,
  }) => {
    const tracingSummary = fieldTraceSummary(
      graphqlResponse.extensions?.tracing ?? {},
    )

    if (typeof tracingSummary === 'string') {
      newrelic.addCustomAttribute('traceSummary', tracingSummary)
    } else {
      let summary = {}
      tracingSummary.forEach(s => Object.assign(summary, s))
      newrelic.addCustomAttributes(summary)
    }

    newrelic.addCustomAttribute(
      'errorCount',
      errorCount(graphqlResponse.errors),
    )
  }
}

export default NewRelicExtension
