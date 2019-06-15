import configure from "webpack-config-jaid"
import {NormalModuleReplacementPlugin} from "webpack"

export default configure({
  publishimo: {
    fetchGithub: true,
  },
  extra: {
    plugins: [
      new NormalModuleReplacementPlugin(/index\.es\.js$/, resource => {
        resource.resource = resource.resource.replace("es.js", "js")
      }),
    ],
  },
})