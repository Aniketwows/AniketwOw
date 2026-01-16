const {
  Client,
  GatewayIntentBits,
  ActivityType,
  SlashCommandBuilder,
  Routes
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
    .setDescription("Send DM notification to a user")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User to notify")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Notification message")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// 🚀 Ready Event
client.once("ready", async () => {
  console.log(`✅ Bot Online: ${client.user.tag}`);
  client.user.setStatus("online");

  setInterval(() => {
    const status = statuses[statusIndex];
    client.user.setActivity(status.name, { type: status.type });
    statusIndex = (statusIndex + 1) % statuses.length;
  }, 10000);

  // Register slash command
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("✅ /noti command registered");
});

// 🔔 Slash Command Handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "noti") {
    const roleName = "Aniketshare/Noti";

    // 🔐 Role Check
    if (!interaction.member.roles.cache.some(r => r.name === roleName)) {
      return interaction.reply({
        content: "❌ Tumhare paas `Aniketshare/Noti` role nahi hai!",
        ephemeral: true
      });
    }

    const user = interaction.options.getUser("user");
    const message = interaction.options.getString("message");

    try {
      await user.send(
        `📢 **Notification from ${interaction.guild.name}**\n\n${message}`
      );

      await interaction.reply({
        content: `✅ DM sent to **${user.tag}**`,
        ephemeral: true
      });
    } catch (err) {
      await interaction.reply({
        content: "❌ User ke DMs closed hain.",
        ephemeral: true
      });
    }
  }
});

// 🧪 Normal Message Test
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.content === "!ping") {
    message.reply("🏓 Pong! Bot Working 🚀");
  }
});

client.login(process.env.TOKEN);


