// @ts-check
/* eslint-env jest */

const NewRelicExtension = require('../src/newrelic-extension')
const newrelic = require('newrelic')
const mockTraceSummary = `Total Duration (ms): 300`
jest.mock('../src/field-trace-summary', () => () => mockTraceSummary)

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
      extension.requestDidStart({
        queryString,
        operationName,
        variables,
        persistedQueryHit,
      })

      expect(newrelic.setTransactionName).toHaveBeenCalledWith(
        'graphql(TestQuery)',
      )
      expect(newrelic.addCustomAttribute).toHaveBeenNthCalledWith(
        1,
        'gqlQuery',
        queryString,
      )
      expect(newrelic.addCustomAttribute).toHaveBeenNthCalledWith(
        2,
        'gqlVars',
        JSON.stringify(variables),
      )
      expect(newrelic.addCustomAttribute).toHaveBeenNthCalledWith(
        3,
        'persistedQueryHit',
        persistedQueryHit,
      )
    })

    it('handles a null operationName', () => {
      newrelic.setTransactionName = jest.fn()
      newrelic.addCustomAttribute = jest.fn()

      const queryString = '{\n testQuery(foo: $foo) {\n id\n }\n }\n'
      const operationName = null
      const variables = { foo: 'bar' }
      const persistedQueryHit = false

      const extension = new NewRelicExtension()
      extension.requestDidStart({
        queryString,
        operationName,
        variables,
        persistedQueryHit,
      })

      expect(newrelic.setTransactionName).toHaveBeenCalledWith(
        'graphql(testQuery(...))',
      )
      expect(newrelic.addCustomAttribute).toHaveBeenNthCalledWith(
        1,
        'gqlQuery',
        queryString,
      )
      expect(newrelic.addCustomAttribute).toHaveBeenNthCalledWith(
        2,
        'gqlVars',
        JSON.stringify(variables),
      )
      expect(newrelic.addCustomAttribute).toHaveBeenNthCalledWith(
        3,
        'persistedQueryHit',
        persistedQueryHit,
      )
    })

    it('handles an empty query string', () => {
      newrelic.setTransactionName = jest.fn()
      newrelic.addCustomAttribute = jest.fn()

      const queryString = ''
      const operationName = ''
      const variables = { foo: 'bar' }
      const persistedQueryHit = false

      const extension = new NewRelicExtension()
      extension.requestDidStart({
        queryString,
        operationName,
        variables,
        persistedQueryHit,
      })

      expect(newrelic.setTransactionName).toHaveBeenCalledWith('graphql()')
      expect(newrelic.addCustomAttribute).toHaveBeenNthCalledWith(
        1,
        'gqlQuery',
        queryString,
      )
      expect(newrelic.addCustomAttribute).toHaveBeenNthCalledWith(
        2,
        'gqlVars',
        JSON.stringify(variables),
      )
      expect(newrelic.addCustomAttribute).toHaveBeenNthCalledWith(
        3,
        'persistedQueryHit',
        persistedQueryHit,
      )
    })
  })

  describe('willSendResponse', () => {
    it('instruments a trace summary and error count before sending the response to the client', () => {
      newrelic.addCustomAttribute = jest.fn()

      const graphqlResponse = {
        extensions: {
          tracing: [],
        },
      }

      const extension = new NewRelicExtension()
      extension.willSendResponse({ graphqlResponse })

      expect(newrelic.addCustomAttribute).toHaveBeenNthCalledWith(
        1,
        'traceSummary',
        mockTraceSummary,
      )
      expect(newrelic.addCustomAttribute).toHaveBeenNthCalledWith(
        2,
        'errorCount',
        0,
      )
    })
  })
})
