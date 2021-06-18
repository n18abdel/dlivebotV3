const { updateDatabase } = require("../helpers/db");
const { createMessageOptions } = require("../helpers/message");
const {
  createChatWebSocket,
  createChestWebSocket,
  getUsername,
} = require("../helpers/request");

const commandData = {
  name: "add",
  description: "Ajouter une alerte",
  options: [
    {
      name: "displayname",
      type: "STRING",
      description: "Le nom du streamer (tel qu'on le voit sur DLive)",
      required: true,
    },
  ],
  defaultPermission: false,
};

const func = async ({ interaction, guildId, channelId, args, botState }) => {
  const {
    settings,
    wasLive,
    alertHistory,
    lastStreams,
    alertChannels,
    websockets,
  } = botState;

  const displayname = args.displayname;

  if (!(guildId in wasLive)) {
    websockets[guildId] = [];
    wasLive[guildId] = {};
    alertHistory[guildId] = {};
    lastStreams[guildId] = {};
    alertChannels[guildId] = channelId;
    await updateDatabase(
      wasLive,
      alertChannels,
      alertHistory,
      lastStreams,
      settings
    );
  }

  getUsername(displayname)
    .then(async (response) => {
      if (response.userByDisplayName) {
        const username = response.userByDisplayName.username;
        if (username in wasLive[guildId]) {
          interaction
            .reply(
              createMessageOptions(`Une alerte existe déjà pour ${displayname}`)
            )
            .catch((error) => console.log(error));
        } else {
          wasLive[guildId][username] = false;
          await updateDatabase(
            wasLive,
            alertChannels,
            alertHistory,
            lastStreams,
            settings
          );

          let ws = createChatWebSocket(username, guildId, channelId, botState);
          let cs = createChestWebSocket(username, guildId, channelId, botState);
          websockets[guildId].push(ws);
          websockets[guildId].push(cs);

          interaction
            .reply(
              createMessageOptions(`Alerte paramétrée pour ${displayname}`)
            )
            .catch((error) => console.log(error));
        }
      } else {
        interaction.reply(
          createMessageOptions(
            `Aucun streamer avec le nom ${displayname} a été trouvé\nVérifiez votre saisie`
          )
        );
      }
    })
    .catch((error) => console.log(error));
};

const add = {
  commandData,
  func,
};

module.exports = add;