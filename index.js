const {
  Client,
  GatewayIntentBits,
  ActivityType,
  SlashCommandBuilder,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const { REST } = require("@discordjs/rest");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

/* ================= CONFIG ================= */
const ROLE_NAME = "Aniketshare/Noti";
const BRAND_COLOR = 0x595967;

/* ================= AUTO STATUS ================= */
const statuses = [
  { name: "Designing in Photoshop 🎨", type: ActivityType.Playing },
  { name: "Turning Ideas into Art ✨", type: ActivityType.Watching },
  { name: "Creative Mode: ON ⚡", type: ActivityType.Listening }
];
let statusIndex = 0;

/* ================= SLASH COMMAND ================= */
const commands = [
  new SlashCommandBuilder()
    .setName("noti")
    .setDescription("Send professional DM notification")
    .setDefaultMemberPermissions(0)
    .addUserOption(o =>
      o.setName("user").setDescription("User to notify").setRequired(true)
    )
    .addStringOption(o =>
      o
        .setName("project")
        .setDescription("Project name (optional)")
        .setRequired(false)
    )
    .addStringOption(o =>
      o
        .setName("filename")
        .setDescription("File names (multiple lines allowed, Shift+Enter)")
        .setRequired(false)
    )
    .addStringOption(o =>
      o
        .setName("status")
        .setDescription("Status (optional)")
        .setRequired(false)
    )
    .addStringOption(o =>
      o
        .setName("size")
        .setDescription("File size (optional)")
        .setRequired(false)
    )
    .addStringOption(o =>
      o
        .setName("link")
        .setDescription("Multiple links allowed (one per line)")
        .setRequired(false)
    )
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

/* ================= READY ================= */
client.once("clientReady", async () => {
  console.log(`✅ Bot Online: ${client.user.tag}`);
  client.user.setStatus("online");

  setInterval(() => {
    const s = statuses[statusIndex];
    client.user.setActivity(s.name, { type: s.type });
    statusIndex = (statusIndex + 1) % statuses.length;
  }, 10000);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("✅ /noti command registered");
});

/* ================= COMMAND HANDLER ================= */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "noti") return;

  if (!interaction.member.roles.cache.some(r => r.name === ROLE_NAME)) {
    return interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true
    });
  }

  const user = interaction.options.getUser("user");

  const project  = interaction.options.getString("project")  || "—";
  const filename = interaction.options.getString("filename") || "—";
  const status   = interaction.options.getString("status")   || "In progress";
  const size     = interaction.options.getString("size")     || "N/A";
  const link     = interaction.options.getString("link");

  /* ========== EMBED ========== */
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setAuthor({
      name: `Notification from ${interaction.guild.name}`,
      iconURL: interaction.guild.iconURL({ dynamic: true })
    })
    .addFields(
      { name: "🧩 Project", value: project },
      { name: "📁 Files", value: filename },
      { name: "📌 Status", value: status, inline: true },
      { name: "📦 Size", value: size, inline: true }
    )
    .setTimestamp();

  /* ========== MULTI-LINK SUPPORT ========== */
  const components = [];

  if (link) {
    const linksFormatted = link
      .split("\n")
      .map((l, i) => `[File ${i + 1}](${l.trim()})`)
      .join("\n");

    embed.addFields({
      name: "🔗 Links",
      value: linksFormatted
    });

    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("📥 Open Files")
          .setStyle(ButtonStyle.Link)
          .setURL(link.split("\n")[0].trim())
      )
    );
  }

  try {
    await user.send({
      embeds: [embed],
      components
    });

    await interaction.reply({
      content: `✅ Notification sent to **${user.tag}**`,
      ephemeral: true
    });
  } catch {
    await interaction.reply({
      content: "❌ User ke DMs closed hain.",
      ephemeral: true
    });
  }
});

/* ================= TEST ================= */
client.on("messageCreate", msg => {
  if (msg.author.bot) return;
  if (msg.content === "!ping") msg.reply("🏓 Pong!");
});

client.login(process.env.TOKEN);
