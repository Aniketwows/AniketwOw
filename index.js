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

// 🎨 Auto Statuses
const statuses = [
  { name: "Designing in Photoshop 🎨", type: ActivityType.Playing },
  { name: "Turning Ideas into Art ✨", type: ActivityType.Watching },
  { name: "Layers • Masks • Magic 🖌️", type: ActivityType.Playing },
  { name: "Creative Mode: ON ⚡", type: ActivityType.Listening },
  { name: "Logos | Banners | Branding 💎", type: ActivityType.Watching },
  { name: "Pixels over Perfection 🧠", type: ActivityType.Playing },
  { name: "Graphic Design Studio 🎧", type: ActivityType.Listening }
];

let statusIndex = 0;

// 🔔 Slash Command
const commands = [
  new SlashCommandBuilder()
    .setName("noti")
    .setDescription("Send professional DM notification")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User to notify")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("project")
        .setDescription("Project name")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("filename")
        .setDescription("File name")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("status")
        .setDescription("Project status")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("size")
        .setDescription("File size")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("link")
        .setDescription("Download/View link")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// 🚀 Ready
client.once("ready", async () => {
  console.log(`✅ Bot Online: ${client.user.tag}`);
  client.user.setStatus("online");

  setInterval(() => {
    const status = statuses[statusIndex];
    client.user.setActivity(status.name, { type: status.type });
    statusIndex = (statusIndex + 1) % statuses.length;
  }, 10000);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("✅ /noti command registered");
});

// 🔔 Command Handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "noti") return;

  const roleName = "Aniketshare/Noti";

  // 🔐 Role Check
  if (!interaction.member.roles.cache.some(r => r.name === roleName)) {
    return interaction.reply({
      content: "❌ Tumhare paas `Aniketshare/Noti` role nahi hai!",
      ephemeral: true
    });
  }

  const user = interaction.options.getUser("user");
  const project = interaction.options.getString("project");
  const filename = interaction.options.getString("filename");
  const status = interaction.options.getString("status");
  const size = interaction.options.getString("size");
  const link = interaction.options.getString("link");

  // ✨ EMBED
  const embed = new EmbedBuilder()
    .setColor("#00ff99")
    .setAuthor({
      name: `Notification from ${interaction.guild.name}`,
      iconURL: interaction.guild.iconURL()
    })
    .setDescription(
      `**Project:** ${project}
**File Name:** ${filename}
**Status:** ${status}
**Size:** ${size}

🔗 **Click below to view or download your files**
${link}`
    )
    .setFooter({
      text: "aniketshare • Elevate Your Brand with Stunning Visuals"
    })
    .setTimestamp();

  try {
    await user.send({ embeds: [embed] });
    await interaction.reply({
      content: `✅ DM sent to **${user.tag}**`,
      ephemeral: true
    });
  } catch (e) {
    await interaction.reply({
      content: "❌ User ke DMs closed hain.",
      ephemeral: true
    });
  }
});

// 🧪 Test
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.content === "!ping") {
    message.reply("🏓 Pong! Bot Working 🚀");
  }
});

client.login(process.env.TOKEN);



