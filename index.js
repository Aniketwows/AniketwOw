const { Client, GatewayIntentBits, ActivityType } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🎨 Activities
const dayActivities = [
  { name: "Designing in Photoshop 🎨", type: ActivityType.Playing },
  { name: "Turning Ideas into Art ✨", type: ActivityType.Watching },
  { name: "Logos | Banners | Branding 💎", type: ActivityType.Watching }
];

const nightActivities = [
  { name: "Late Night Creativity 🌙", type: ActivityType.Listening },
  { name: "Creative Mode: ON ⚡", type: ActivityType.Playing }
];

let activityIndex = 0;

// ⏰ Get India Time (IST)
function getISTHour() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false
  });
}

client.once("ready", () => {
  console.log(`✅ Bot Online: ${client.user.tag}`);

  setInterval(() => {
    const hour = parseInt(getISTHour());

    // 🌞 DAY TIME
    if (hour >= 9 && hour < 24) {
      client.user.setStatus("online");

      const activity = dayActivities[activityIndex % dayActivities.length];
      client.user.setActivity(activity.name, { type: activity.type });
    }

    // 🌙 MID NIGHT
    else if (hour >= 0 && hour < 2) {
      client.user.setStatus("idle");

      const activity = nightActivities[activityIndex % nightActivities.length];
      client.user.setActivity(activity.name, { type: activity.type });
    }

    // 😴 SLEEP TIME
    else {
      client.user.setStatus("dnd");
      client.user.setActivity("Sleeping 😴", { type: ActivityType.Watching });
    }

    activityIndex++;
  }, 300000); // 🔁 Every 5 minutes
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    message.reply("🏓 Pong! Bot is Active 🚀");
  }
});

client.login(process.env.TOKEN);

