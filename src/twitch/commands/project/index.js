import {config} from "src/core"
import afkManager from "src/twitch/afkManager"
import repoPackageJson from "repo-package-json"
import hasContent, {isEmpty} from "has-content"

function getDependenciesFromPkg(pkg) {
  const dependencies = new Set
  const dependencyKeys = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies", "bundleDependencies", "bundledDependencies"]
  for (const dependencyKey of dependencyKeys) {
    if (isEmpty(pkg[dependencyKey])) {
      continue
    }
    for (const dependency of Object.keys(pkg[dependencyKey])) {
      dependencies.add(dependency)
    }
  }
  return dependencies
}

export default {
  permission: "mod",
  async handle({positionalArguments}) {
    const repo = positionalArguments[0]
    const technologies = ["Node"]
    const pkg = await repoPackageJson(`${config.githubUser}/${repo}`)
    const dependencies = getDependenciesFromPkg(pkg)
    if (hasContent(config.projectDependencyNames)) {
      for (const [possibleDependency, possibleTechnology] of Object.entries(config.projectDependencyNames)) {
        if (dependencies.has(possibleDependency)) {
          technologies.push(possibleTechnology)
        }
      }
    }
    const title = pkg.title || pkg.name || repo
    await afkManager.setTitle(`${title} weiterentwickeln! (${technologies.join(", ")})`)
    return `Der Titel sagt jetzt aus, dass an ${title} weitergearbeitet wird.`
  },
}