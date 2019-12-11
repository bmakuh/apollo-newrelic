import { GraphQLExtension } from 'graphql-extensions'
import newrelic from 'newrelic'
import fieldTraceSummary from './field-trace-summary'

const errorCount = (errors: readonly any[] = []) => errors.length

class ApolloNewRelic extends GraphQLExtension {
  requestDidStart: GraphQLExtension['requestDidStart'] = ({
    queryString = '',
    operationName,
    persistedQueryHit = false,
  }) => {
    const queryMatch = queryString.match(/(\{\n?\s+?)([a-z]+)(\(.*)/i)
    const queryName = queryMatch ? queryMatch[2] + '(...)' : ''
    const transactionName = operationName || queryName

    newrelic.setTransactionName(`graphql(${transactionName})`)
    newrelic.addCustomAttributes({
      gqlQuery: queryString,
      persistedQueryHit,
    })
  }

  willResolveField: GraphQLExtension['willResolveField'] = (
    _source,
    _args,
    _context,
    info,
  ) => {
    if (info.parentType.name !== 'Query') {
      return
    }

    const segmentName = `${info.operation.operation} ${info.fieldName}: ${info.returnType}`
    return newrelic.startSegment(segmentName, true, () => {
      return (err: Error | null, res: any) => {}
    })
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

interface Resolver {
  [key: string]: Function
}
interface GqlInterface {
  Query?: Resolver
  Mutation?: Resolver
  Subscription?: Resolver
}

export function markResolversAsTransactions<T extends GqlInterface>(
  resolvers: T,
): T {
  const requestTypes = Object.keys(resolvers) as Array<keyof GqlInterface>
  requestTypes.forEach(requestType => {
    if (typeof resolvers[requestType]) {
      let res = resolvers[requestType]!
      Object.entries(res).forEach(([k, resolver]) => {
        res[k] = (...args: unknown[]) =>
          newrelic.startWebTransaction(`${requestType}: ${k}`, () => {
            newrelic.setTransactionName(`${requestType}: ${k}`)
            return resolver(...args)
          })
      })
    }
  })

  return resolvers
}

function hasRequestType<T extends Resolver>(
  resolver: T | undefined,
): resolver is T {
  return typeof resolver !== 'undefined'
}

export default ApolloNewRelic
