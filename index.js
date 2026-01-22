require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

/* ================= AUTO STATUS (UNCHANGED) ================= */

const statuses = [
  { name: "Designing in Photoshop 🎨", type: ActivityType.Playing },
  { name: "Turning Ideas into Art ✨", type: ActivityType.Watching },
  { name: "Creative Mode: ON ⚡", type: ActivityType.Listening }
];

let statusIndex = 0;

/* ================= SIMPLE MEMORY DB ================= */

const filesDB = {}; // userId : [{ title, link }]

/* ================= READY ================= */

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    status: "online",
    activities: [statuses[0]]
  });

  setInterval(() => {
    statusIndex = (statusIndex + 1) % statuses.length;
    client.user.setActivity(statuses[statusIndex]);
  }, 10000);

  // Register slash commands
  await client.application.commands.set([
    new SlashCommandBuilder()
      .setName("savefile")
      .setDescription("Save final file link for client")
      .addUserOption(o =>
        o.setName("client").setDescription("Client").setRequired(true)
      )
      .addStringOption(o =>
        o.setName("title").setDescription("File title").setRequired(true)
      )
      .addStringOption(o =>
        o.setName("link").setDescription("Drive link").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("thumbnail")
      .setDescription("Send thumbnail preview to client")
      .addUserOption(o =>
        o.setName("client").setDescription("Client").setRequired(true)
      )
      .addAttachmentOption(o =>
        o.setName("image").setDescription("Thumbnail image").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("myfiles")
      .setDescription("Client: view your saved files")
  ]);
});

/* ================= INTERACTIONS ================= */

client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    /* ---- /savefile ---- */
    if (commandName === "savefile") {
      const clientUser = interaction.options.getUser("client");
      const title = interaction.options.getString("title");
      const link = interaction.options.getString("link");

      if (!filesDB[clientUser.id]) filesDB[clientUser.id] = [];
      filesDB[clientUser.id].push({ title, link });

      const embed = new EmbedBuilder()
        .setTitle("📁 File Delivered")
        .addFields(
          { name: "Project", value: title },
          { name: "Download", value: link }
        )
        .setColor(0x00ff99);

      await clientUser.send({ embeds: [embed] });
      await interaction.reply({ content: "File saved & sent in DM", ephemeral: true });
    }

    /* ---- /thumbnail ---- */
    if (commandName === "thumbnail") {
      const clientUser = interaction.options.getUser("client");
      const image = interaction.options.getAttachment("image");

      const embed = new EmbedBuilder()
        .setTitle("🖼 Thumbnail Preview")
        .setImage(image.url)
        .setColor(0x5865f2);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("approve")
          .setLabel("Approve")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("changes")
          .setLabel("Changes Needed")
          .setStyle(ButtonStyle.Danger)
      );

      await clientUser.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: "Thumbnail sent in DM", ephemeral: true });
    }

    /* ---- /myfiles ---- */
    if (commandName === "myfiles") {
      const data = filesDB[interaction.user.id];
      if (!data || data.length === 0) {
        return interaction.reply({ content: "No files found.", ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle("📂 Your Files")
        .setColor(0x00bfff);

      data.forEach(f => {
        embed.addFields({ name: f.title, value: f.link });
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  /* ---- BUTTONS ---- */
  if (interaction.isButton()) {
    if (interaction.customId === "approve") {
      await interaction.reply({ content: "✅ Approved", ephemeral: true });
    }
    if (interaction.customId === "changes") {
      await interaction.reply({ content: "✏️ Changes requested", ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
