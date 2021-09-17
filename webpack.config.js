import configure from "webpack-config-jaid"

export default configure({
  publishimo: {
    fetchGithub: true,
  },
  extra: {
    resolve: {
      alias: {
        "node-fetch$": "node-fetch/lib/index.js", // https://github.com/bitinn/node-fetch/issues/493#issuecomment-414111024
      },
    },
  },
})