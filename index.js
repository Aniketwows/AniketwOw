const { Client, GatewayIntentBits, ActivityType } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🎨 Graphic Design / Photoshop Statuses
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

client.once("ready", () => {
  console.log(`✅ Bot Online: ${client.user.tag}`);
  client.user.setStatus("online");

  setInterval(() => {
    const status = statuses[statusIndex];
    client.user.setActivity(status.name, { type: status.type });
    statusIndex = (statusIndex + 1) % statuses.length;
  }, 10000);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    message.reply("🏓 Pong! Bot is working 🚀");
  }
});

client.login(process.env.TOKEN);
