export const userNameToDisplayName = async (client, userName) => {
  const profile = await client.helix.users.getUserByName(userName)
  return profile?.displayName || userName
}

export const getFollowMoment = async (client, userName) => {
  const user = await client.helix.users.getUserByName(userName)
  const followResult = await user.getFollowTo("65887522")
  if (followResult === null) {
    return false
  }
  return moment(followResult.followDate).locale("de")
}