export interface Resolver {
  path: string[]
  parentType: 'Query' | string
  fieldName: string
  returnType: string
  startOffset: number
  duration: number
}

export interface Trace {
  duration: number
  startTime: string
  endTime: string
  version: number
  execution: {
    resolvers: Array<Resolver>
  }
}

function isValidTrace(trace?: Trace | {}): trace is Trace {
  return !!(trace && Object.keys(trace).length !== 0)
}

const fieldTraceSummary = (
  trace: Trace | {},
): Array<{ [key: string]: string }> | string => {
  if (!isValidTrace(trace)) {
    return 'No trace data'
  }

  try {
    const resolvers = trace.execution.resolvers.filter(
      x => x.parentType === 'Query',
    )

    const resolversSummaries = resolvers.map(resolverFieldSummary)

    return [
      { 'Total Duration (ms)': `${toMilliseconds(trace.duration)}` },
      ...resolversSummaries,
    ]
  } catch (err) {
    return `Error getting trace summary: ${err.message}`
  }
}

const toMilliseconds = (x: number) => x / 1000000

const resolverFieldSummary = ({
  fieldName,
  returnType,
  duration,
}: Resolver) => ({
  [`Field \`${fieldName}: ${returnType}\` Duration (ms)`]: `${toMilliseconds(
    duration,
  )}`,
})

export default fieldTraceSummary
