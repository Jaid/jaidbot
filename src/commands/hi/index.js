export default {
  handle({msg, say}) {
    say(`Hey, ${msg.userInfo.displayName}!`)
  },
}