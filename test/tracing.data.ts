export default {
  tracing: {
    version: 1,
    startTime: '2019-12-06T18:06:29.540Z',
    endTime: '2019-12-06T18:06:29.616Z',
    duration: 75524603,
    execution: {
      resolvers: [
        {
          path: ['character'],
          parentType: 'Query',
          fieldName: 'character',
          returnType: 'Character',
          startOffset: 3756652,
          duration: 62991270,
        },
        {
          path: ['character'],
          parentType: 'Query',
          fieldName: 'character',
          returnType: 'CharacterConnection',
          startOffset: 11365496,
          duration: 63826914,
        },
        {
          path: ['character', 'list'],
          parentType: 'CharacterConnection',
          fieldName: 'list',
          returnType: '[Character!]!',
          startOffset: 75274909,
          duration: 101078,
        },
      ],
    },
  },
}
