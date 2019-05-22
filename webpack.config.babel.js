import {configureExecutable} from "webpack-config-jaid"
import {NormalModuleReplacementPlugin} from "webpack"

export default configureExecutable({
  publishimo: {
    fetchGithub: true,
  },
  extra: {
    plugins: [
      new NormalModuleReplacementPlugin(/index\.es\.js$/, resource => {
        console.log(resource)
        resource.resource = resource.resource.replace("es.js", "js")
      }),
    ],
  },
})