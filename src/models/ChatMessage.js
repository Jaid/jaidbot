import Sequelize from "sequelize"
// import ChatMessageBadge from "src/models/ChatMessageBadge"
// import EmoteUsage from "src/models/EmoteUsage"
import twitch from "src/plugins/twitch"
import TwitchUser from "src/models/TwitchUser"

class ChatMessage extends Sequelize.Model {

  static start() {
    twitch.on("chat", async message => {
      const twitchUser = await TwitchUser.findOrRegisterById(message.sender.id, {
        defaults: {
          nameColor: message.sender.color,
        },
      })
      await ChatMessage.create({
        TwitchUserId: twitchUser.id,
        senderDisplayName: message.sender.displayName,
        nameColor: message.sender.color,
        bits: message.bits,
        message: message.text,
        messageSentAt: message.sentDate,
        senderIsMod: message.sender.isMod,
        senderIsVip: message.sender.isVip,
        senderIsSubscriber: message.sender.isSub,
      })
    })
  }

  static associate(models) {
    ChatMessage.belongsTo(models.TwitchUser, {
      foreignKey: {
        allowNull: false,
      },
    })
  }

}

export const schema = {

  senderDisplayName: Sequelize.STRING(64),
  nameColor: Sequelize.STRING,
  bits: {
    allowNull: false,
    type: Sequelize.INTEGER,
  },
  message: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  messageSentAt: Sequelize.DATE,
  senderIsMod: Sequelize.BOOLEAN,
  senderIsVip: Sequelize.BOOLEAN,
  senderIsSubscriber: Sequelize.BOOLEAN,

}

// ChatMessage.belongsTo(TwitchUser, {
//   foreignKey: {
//     allowNull: false,
//   },
// })

// ChatMessage.hasMany(ChatMessageBadge, {
//   foreignKey: {
//     allowNull: false,
//   },
// })

// ChatMessage.hasMany(EmoteUsage, {
//   foreignKey: {
//     allowNull: false,
//   },
// })

export default ChatMessage