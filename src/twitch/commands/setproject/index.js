import {config} from "src/core"
import afkManager from "src/twitch/afkManager"
import repoPackageJson from "repo-package-json"
import hasContent, {isEmpty} from "has-content"
import nestext from "nestext"
import {shuffle} from "lodash"

import titleNestext from "./title.nestext.yml"

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
    let technologies = new Set
    const pkg = await repoPackageJson(`${config.githubUser}/${repo}`)
    const dependencies = getDependenciesFromPkg(pkg)
    if (hasContent(config.projectDependencyNames)) {
      for (const [possibleDependency, possibleTechnology] of Object.entries(config.projectDependencyNames)) {
        if (dependencies.has(possibleDependency)) {
          technologies.add(possibleTechnology)
        }
      }
    }
    technologies = shuffle([...technologies])
    if (technologies.length > config.maxTechnologiesInTitle) {
      technologies.length = config.maxTechnologiesInTitle
    }
    const projectTitle = pkg.domain || pkg.title || pkg.name || repo
    const title = nestext(titleNestext, {
      projectTitle,
      pkg,
      technologyList: technologies.join(", "),
    })
    await afkManager.setTitle(title)
    return `Neuer Titel: ${projectTitle}`
  },
}