/* eslint-env jest */

import newrelic from 'newrelic'
import NewRelicExtension from '../src/newrelic-extension'
import tracingData from './tracing.data'
jest.mock('newrelic')

describe('NewRelicExtension', () => {
  describe('requestDidStart', () => {
    it('creates a newrelic transaction with custom attributes when a request begins', () => {
      newrelic.setTransactionName = jest.fn()
      newrelic.addCustomAttribute = jest.fn()

      const queryString =
        'query TestQuery($foo: String!) {\n testQuery(foo: $foo) {\n id\n }\n }\n'
      const operationName = 'TestQuery'
      const variables = { foo: 'bar' }
      const persistedQueryHit = false

      const extension = new NewRelicExtension()
      // @ts-ignore
      extension.requestDidStart({
        queryString,
        operationName,
        variables,
        persistedQueryHit,
      })

      expect(newrelic.setTransactionName).toHaveBeenCalledWith(
        'graphql(TestQuery)',
      )
      expect(newrelic.addCustomAttributes).toHaveBeenCalledWith({
        gqlQuery: queryString,
        persistedQueryHit: persistedQueryHit,
      })
    })

    it('handles a null operationName', () => {
      newrelic.setTransactionName = jest.fn()
      newrelic.addCustomAttribute = jest.fn()

      const queryString = '{\n testQuery(foo: $foo) {\n id\n }\n }\n'
      const operationName = null
      const variables = { foo: 'bar' }
      const persistedQueryHit = false

      const extension = new NewRelicExtension()
      // @ts-ignore
      extension.requestDidStart({
        queryString,
        operationName,
        variables,
        persistedQueryHit,
      })

      expect(newrelic.setTransactionName).toHaveBeenCalledWith(
        'graphql(testQuery(...))',
      )
      expect(newrelic.addCustomAttributes).toHaveBeenCalledWith({
        gqlQuery: queryString,
        persistedQueryHit: persistedQueryHit,
      })
    })

    it('handles an empty query string', () => {
      newrelic.setTransactionName = jest.fn()
      newrelic.addCustomAttribute = jest.fn()

      const queryString = ''
      const operationName = ''
      const variables = { foo: 'bar' }
      const persistedQueryHit = false

      const extension = new NewRelicExtension()
      // @ts-ignore
      extension.requestDidStart({
        queryString,
        operationName,
        variables,
        persistedQueryHit,
      })

      expect(newrelic.setTransactionName).toHaveBeenCalledWith('graphql()')
      expect(newrelic.addCustomAttributes).toHaveBeenCalledWith({
        gqlQuery: queryString,
        persistedQueryHit: persistedQueryHit,
      })
    })
  })

  describe('willSendResponse', () => {
    it('instruments a trace summary and error count before sending the response to the client', () => {
      const mockTraceSummary =
        'Total Duration (ms): 75.524603 | { character: Character - Duration (ms): 62.99127 } | { character: CharacterConnection - Duration (ms): 63.826914 }'
      newrelic.addCustomAttributes = jest.fn()

      const graphqlResponse = {
        extensions: tracingData,
      }

      const extension = new NewRelicExtension()
      // @ts-ignore
      extension.willSendResponse({ graphqlResponse })

      expect(newrelic.addCustomAttributes).toHaveBeenCalledWith({
        'Total Duration (ms)': '75.524603',
        'Field `character: Character` Duration (ms)': '62.99127',
        'Field `character: CharacterConnection` Duration (ms)': '63.826914',
      })
    })
  })
})
