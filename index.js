const {
  Client,
  GatewayIntentBits,
  ActivityType,
  SlashCommandBuilder,
  Routes,
  EmbedBuilder
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

/* ================= BRAND CONFIG ================= */
const BRAND = {
  name: "aniketshare",
  color: 0x22c55e, // premium green
  logo: "https://aniketshare.framer.website/favicon.ico"
};

/* ================= AUTO STATUS ================= */
const statuses = [
  { name: "Designing in Photoshop 🎨", type: ActivityType.Playing },
  { name: "Turning Ideas into Art ✨", type: ActivityType.Watching },
  { name: "Creative Mode: ON ⚡", type: ActivityType.Listening },
  { name: "Logos | Banners | Branding 💎", type: ActivityType.Watching }
];

let statusIndex = 0;

/* ================= SLASH COMMAND ================= */
const commands = [
  new SlashCommandBuilder()
    .setName("noti")
    .setDescription("Send premium project notification (DM)")
    .addUserOption(o =>
      o.setName("user").setDescription("User").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("project").setDescription("Project name").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("filename").setDescription("File name").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("status").setDescription("Status").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("size").setDescription("File size").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("link").setDescription("Download/View link").setRequired(true)
    )
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

/* ================= READY ================= */
client.once("ready", async () => {
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

  const roleName = "Aniketshare/Noti";

  if (!interaction.member.roles.cache.some(r => r.name === roleName)) {
    return interaction.reply({
      content: "❌ You don't have permission to use this command.",
      ephemeral: true
    });
  }

  const user = interaction.options.getUser("user");
  const project = interaction.options.getString("project");
  const filename = interaction.options.getString("filename");
  const status = interaction.options.getString("status");
  const size = interaction.options.getString("size");
  const link = interaction.options.getString("link");

  /* ================= POLISHED EMBED ================= */
  const embed = new EmbedBuilder()
    .setColor(BRAND.color)
    .setAuthor({
      name: `📢 Notification from ${interaction.guild.name}`,
      iconURL: interaction.guild.iconURL({ dynamic: true })
    })
    .setThumbnail(BRAND.logo)
    .setDescription("🚀 **Your project update is here!**")
    .addFields(
      { name: "🧩 Project", value: project, inline: true },
      { name: "📄 File Name", value: filename, inline: true },
      { name: "📊 Status", value: status, inline: true },
      { name: "💾 Size", value: size, inline: true },
      {
        name: "🔗 Download / View Files",
        value: `[👉 Click here to access your files](${link})`
      }
    )
    .setFooter({
      text: `${BRAND.name} • Elevate Your Brand with Stunning Visuals`,
      iconURL: BRAND.logo
    })
    .setTimestamp();

  try {
    await user.send({ embeds: [embed] });
    await interaction.reply({
      content: `✅ Notification sent to **${user.tag}**`,
      ephemeral: true
    });
  } catch {
    await interaction.reply({
      content: "❌ User DMs are closed.",
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




