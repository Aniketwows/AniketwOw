const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
} = require("discord.js");

const fs = require("fs");
const path = require("path");
require("dotenv").config();

/* ===================== CLIENT ===================== */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

/* ===================== SETTINGS ===================== */
const PREFIX = "!";
const OWNER_ID = "YOUR_DISCORD_ID_HERE"; // ✅ apna discord ID daalo

// ✅ Railway persistent disk recommended (but without it also works while running)
const DB_PATH = path.join(__dirname, "vault.json");

/* ===================== DB HELPERS ===================== */
function loadDB() {
  try {
    if (!fs.existsSync(DB_PATH)) return {};
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch (e) {
    console.log("DB Load Error:", e);
    return {};
  }
}

function saveDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.log("DB Save Error:", e);
  }
}

/* ===================== READY ===================== */
client.once("ready", () => {
  console.log(`✅ Bot is online: ${client.user.tag}`);
});

/* ===========================================================
   ✅ DM CLIENT FILE VAULT SYSTEM (EXTRA FEATURE ONLY)
   ✅ This will NOT affect your existing server commands
   ✅ Works only in DMs
=========================================================== */
client.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return;

    // ✅ ONLY DM commands (server system untouched)
    if (msg.guild) return;

    const text = msg.content.trim();
    if (!text.startsWith(PREFIX)) return;

    const db = loadDB();

    /* ===================== CLIENT COMMANDS ===================== */

    // !files => client sees their saved file titles
    if (text === "!files") {
      const userId = msg.author.id;
      const userVault = db[userId] || [];

      if (userVault.length === 0) {
        return msg.reply("📭 Tumhare liye abhi koi files saved nahi hai.");
      }

      const list = userVault
        .map((f, i) => `**${i + 1}.** ${f.title}`)
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle("📁 Your Saved Files")
        .setDescription(list)
        .setFooter({ text: "Use: !get <title>" });

      return msg.reply({ embeds: [embed] });
    }

    // !get <title> => client gets file link
    if (text.startsWith("!get ")) {
      const userId = msg.author.id;
      const query = text.replace("!get ", "").trim().toLowerCase();

      const userVault = db[userId] || [];
      const found = userVault.find((f) => f.title.toLowerCase() === query);

      if (!found) {
        return msg.reply("❌ File nahi mili. `!files` karke list dekho.");
      }

      const embed = new EmbedBuilder()
        .setTitle(`📥 ${found.title}`)
        .setDescription(`🔗 **Link:** ${found.link}`)
        .setFooter({ text: "Agar link open na ho to copy paste kar lena." });

      return msg.reply({ embeds: [embed] });
    }

    /* ===================== OWNER ONLY COMMANDS ===================== */
    if (msg.author.id !== OWNER_ID) {
      // ✅ help for normal clients
      if (text === "!help") {
        return msg.reply(
          `📌 **Commands**\n\n` +
            `👤 Client:\n` +
            `• \`!files\` = saved files list\n` +
            `• \`!get <title>\` = file link\n`
        );
      }
      return;
    }

    // !save @client title | link
    if (text.startsWith("!save ")) {
      const mentioned = msg.mentions.users.first();
      if (!mentioned) {
        return msg.reply(
          "❌ Format: `!save @client title | link`\nExample: `!save @aniket Logo Pack | https://drive...`"
        );
      }

      const rest = text.replace("!save ", "");

      const cleaned = rest
        .replace(`<@${mentioned.id}>`, "")
        .replace(`<@!${mentioned.id}>`, "")
        .trim();

      const parts = cleaned.split("|");
      if (parts.length < 2) {
        return msg.reply("❌ Format wrong. Use: `title | link`");
      }

      const title = parts[0].trim();
      const link = parts[1].trim();

      if (!title || !link) return msg.reply("❌ Title & link required.");

      if (!db[mentioned.id]) db[mentioned.id] = [];

      // overwrite if same title exists
      db[mentioned.id] = db[mentioned.id].filter(
        (f) => f.title.toLowerCase() !== title.toLowerCase()
      );

      db[mentioned.id].push({
        title,
        link,
        savedAt: Date.now(),
      });

      saveDB(db);

      await msg.reply(`✅ Saved for **${mentioned.username}**: **${title}**`);

      // notify client
      try {
        await mentioned.send(
          `✅ Tumhare liye ek file save hua hai: **${title}**\nUse: \`!files\` ya \`!get ${title}\``
        );
      } catch (e) {}

      return;
    }

    // !delete @client title
    if (text.startsWith("!delete ")) {
      const mentioned = msg.mentions.users.first();
      if (!mentioned) return msg.reply("❌ Format: `!delete @client title`");

      const title = text
        .replace("!delete ", "")
        .replace(`<@${mentioned.id}>`, "")
        .replace(`<@!${mentioned.id}>`, "")
        .trim();

      if (!db[mentioned.id] || db[mentioned.id].length === 0) {
        return msg.reply("❌ Is client ke paas koi file saved nahi hai.");
      }

      const before = db[mentioned.id].length;

      db[mentioned.id] = db[mentioned.id].filter(
        (f) => f.title.toLowerCase() !== title.toLowerCase()
      );

      if (db[mentioned.id].length === before) {
        return msg.reply("❌ Title match nahi mila.");
      }

      saveDB(db);
      return msg.reply(`🗑️ Deleted **${title}** for **${mentioned.username}**`);
    }

    // !clear @client
    if (text.startsWith("!clear ")) {
      const mentioned = msg.mentions.users.first();
      if (!mentioned) return msg.reply("❌ Format: `!clear @client`");

      db[mentioned.id] = [];
      saveDB(db);

      return msg.reply(`✅ Cleared all files for **${mentioned.username}**`);
    }

    // owner help
    if (text === "!help") {
      return msg.reply(
        `📌 **Commands**\n\n` +
          `👑 Owner:\n` +
          `• \`!save @client title | link\`\n` +
          `• \`!delete @client title\`\n` +
          `• \`!clear @client\`\n\n` +
          `👤 Client:\n` +
          `• \`!files\`\n` +
          `• \`!get <title>\`\n`
      );
    }
  } catch (err) {
    console.log("DM Vault Error:", err);
  }
});

/* ===================== LOGIN ===================== */
client.login(process.env.TOKEN);
