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
  ActivityType,
  PermissionFlagsBits
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

/* ================= MEMORY DB ================= */

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

  await client.application.commands.set([
    // ADMIN: /noti (UNCHANGED behavior)
    new SlashCommandBuilder()
      .setName("noti")
      .setDescription("Send personal DM notification to client")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption(o =>
        o.setName("client").setDescription("Client").setRequired(true)
      )
      .addStringOption(o =>
        o.setName("message").setDescription("Message").setRequired(true)
      ),

    // ADMIN: /savefile
    new SlashCommandBuilder()
      .setName("savefile")
      .setDescription("Save final file for client")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption(o =>
        o.setName("client").setDescription("Client").setRequired(true)
      )
      .addStringOption(o =>
        o.setName("title").setDescription("File title").setRequired(true)
      )
      .addStringOption(o =>
        o.setName("link").setDescription("Drive link").setRequired(true)
      ),

    // ADMIN: /thumbnail
    new SlashCommandBuilder()
      .setName("thumbnail")
      .setDescription("Send thumbnail preview to client")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption(o =>
        o.setName("client").setDescription("Client").setRequired(true)
      )
      .addAttachmentOption(o =>
        o.setName("image").setDescription("Thumbnail").setRequired(true)
      ),

    // CLIENT: /myfiles
    new SlashCommandBuilder()
      .setName("myfiles")
      .setDescription("View your saved files")
  ]);
});

/* ================= INTERACTIONS ================= */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  /* ---------- ADMIN CHECK ---------- */
  const isAdmin =
    !process.env.ADMIN_ID || interaction.user.id === process.env.ADMIN_ID;

  /* ---------- COMMANDS ---------- */
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    /* /noti (UNCHANGED SIMPLE DM) */
    if (commandName === "noti") {
      if (!isAdmin)
        return interaction.reply({ content: "Not allowed.", ephemeral: true });

      const user = interaction.options.getUser("client");
      const message = interaction.options.getString("message");

      await user.send(message); // EXACT old behavior
      return interaction.reply({
        content: "Notification sent.",
        ephemeral: true
      });
    }

    /* /savefile */
    if (commandName === "savefile") {
      if (!isAdmin)
        return interaction.reply({ content: "Not allowed.", ephemeral: true });

      const user = interaction.options.getUser("client");
      const title = interaction.options.getString("title");
      const link = interaction.options.getString("link");

      if (!filesDB[user.id]) filesDB[user.id] = [];
      filesDB[user.id].push({ title, link });

      const embed = new EmbedBuilder()
        .setTitle("📁 File Delivered")
        .addFields(
          { name: "Project", value: title },
          { name: "Download", value: link }
        )
        .setColor(0x00ff99);

      await user.send({ embeds: [embed] });
      return interaction.reply({
        content: "File saved & sent.",
        ephemeral: true
      });
    }

    /* /thumbnail */
    if (commandName === "thumbnail") {
      if (!isAdmin)
        return interaction.reply({ content: "Not allowed.", ephemeral: true });

      const user = interaction.options.getUser("client");
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

      await user.send({ embeds: [embed], components: [row] });
      return interaction.reply({
        content: "Thumbnail sent.",
        ephemeral: true
      });
    }

    /* /myfiles (CLIENT ONLY) */
    if (commandName === "myfiles") {
      const data = filesDB[interaction.user.id];
      if (!data || data.length === 0)
        return interaction.reply({
          content: "No files found.",
          ephemeral: true
        });

      const embed = new EmbedBuilder()
        .setTitle("📂 Your Files")
        .setColor(0x00bfff);

      data.forEach(f => embed.addFields({ name: f.title, value: f.link }));

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  /* ---------- BUTTONS ---------- */
  if (interaction.isButton()) {
    if (interaction.customId === "approve")
      return interaction.reply({ content: "✅ Approved", ephemeral: true });

    if (interaction.customId === "changes")
      return interaction.reply({
        content: "✏️ Changes requested",
        ephemeral: true
      });
  }
});

client.login(process.env.TOKEN);
