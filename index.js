require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes
} = require("discord.js");

const db = require("./db");

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* ---------- SLASH COMMANDS ---------- */
const commands = [
  new SlashCommandBuilder()
    .setName("savefile")
    .setDescription("Save final file for client")
    .addUserOption(o => o.setName("client").setDescription("Client").setRequired(true))
    .addStringOption(o => o.setName("project").setDescription("Project").setRequired(true))
    .addStringOption(o => o.setName("filename").setDescription("File name").setRequired(true))
    .addStringOption(o => o.setName("link").setDescription("Drive link").setRequired(true)),

  new SlashCommandBuilder()
    .setName("myfiles")
    .setDescription("Get your files"),

  new SlashCommandBuilder()
    .setName("thumbnail")
    .setDescription("Send thumbnail preview")
    .addUserOption(o => o.setName("client").setDescription("Client").setRequired(true))
    .addAttachmentOption(o => o.setName("image").setDescription("Preview image").setRequired(true))
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

client.once("ready", async () => {
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );
  console.log("Bot online & commands registered");
});

/* ---------- INTERACTIONS ---------- */
client.on("interactionCreate", async interaction => {

  /* ===== SLASH COMMANDS ===== */
  if (interaction.isChatInputCommand()) {

    /* ADMIN ONLY */
    if (interaction.commandName === "savefile") {
      if (interaction.user.id !== process.env.ADMIN_ID)
        return interaction.reply({ content: "Not allowed", ephemeral: true });

      const clientUser = interaction.options.getUser("client");
      const project = interaction.options.getString("project");
      const filename = interaction.options.getString("filename");
      const link = interaction.options.getString("link");

      db.run(
        "INSERT INTO files (client_id, project, filename, link) VALUES (?,?,?,?)",
        [clientUser.id, project, filename, link]
      );

      const embed = new EmbedBuilder()
        .setTitle("Files Updated")
        .addFields(
          { name: "Project", value: project },
          { name: "File", value: filename }
        );

      await clientUser.send({ embeds: [embed] });
      return interaction.reply({ content: "File saved & client notified", ephemeral: true });
    }

    /* CLIENT */
    if (interaction.commandName === "myfiles") {
      db.all(
        "SELECT project, filename FROM files WHERE client_id=?",
        [interaction.user.id],
        (err, rows) => {
          if (!rows || rows.length === 0)
            return interaction.reply({ content: "No files found", ephemeral: true });

          const embed = new EmbedBuilder().setTitle("Your Files");
          const row = new ActionRowBuilder();

          rows.forEach((f, i) => {
            embed.addFields({
              name: `${i + 1}. ${f.project}`,
              value: f.filename
            });

            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`get_${f.filename}`)
                .setLabel(`Download ${i + 1}`)
                .setStyle(ButtonStyle.Primary)
            );
          });

          interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }
      );
    }

    /* THUMBNAIL PREVIEW */
    if (interaction.commandName === "thumbnail") {
      if (interaction.user.id !== process.env.ADMIN_ID)
        return interaction.reply({ content: "Not allowed", ephemeral: true });

      const clientUser = interaction.options.getUser("client");
      const image = interaction.options.getAttachment("image");

      const embed = new EmbedBuilder()
        .setTitle("Thumbnail Preview")
        .setImage(image.url)
        .setDescription("Please review and respond");

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("approve").setLabel("Approve").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("changes").setLabel("Changes Needed").setStyle(ButtonStyle.Danger)
      );

      await clientUser.send({ embeds: [embed], components: [buttons] });
      interaction.reply({ content: "Preview sent", ephemeral: true });
    }
  }

  /* ===== BUTTONS ===== */
  if (interaction.isButton()) {

    if (interaction.customId.startsWith("get_")) {
      const filename = interaction.customId.replace("get_", "");

      db.get(
        "SELECT link FROM files WHERE client_id=? AND filename=?",
        [interaction.user.id, filename],
        (err, row) => {
          if (!row)
            return interaction.reply({ content: "File not found", ephemeral: true });

          interaction.reply({ content: row.link, ephemeral: true });
        }
      );
    }

    if (interaction.customId === "approve") {
      interaction.reply({ content: "Approved ✔", ephemeral: true });
      client.users.fetch(process.env.ADMIN_ID)
        .then(u => u.send("Client approved thumbnail"));
    }

    if (interaction.customId === "changes") {
      interaction.reply({ content: "Changes requested ❌", ephemeral: true });
      client.users.fetch(process.env.ADMIN_ID)
        .then(u => u.send("Client requested changes"));
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
