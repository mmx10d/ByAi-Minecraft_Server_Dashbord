const fs = require("fs");
const obs = require("javascript-obfuscator");
function exp(file, savelocation) {
  fs.readFile(file, "utf-8", (err, data) => {
    if (err) {
      console.log(err)
      throw err;
    }
    let result = obs.obfuscate(data);
    fs.writeFile(savelocation, result.getObfuscatedCode(), function (err) {
      if (err) {
        console.log(err)
        return err;
      }
      console.log(file + " is done")
    })
  })
};


exp("index.js", "js-obf/index.js");
exp("minecraft.js", "js-obf/minecraft.js");
exp("Clients/discordBot.js", "js-obf/Clients/discordBot.js");
exp("Clients/telegramBot.js", "js-obf/Clients/telegramBot.js");
exp("Clients/web/script.js", "js-obf/Clients/web/script.js");


exp("commands/backup.js", "js-obf/commands/backup.js");
exp("commands/files.js", "js-obf/commands/files.js");
exp("commands/host.js", "js-obf/commands/host.js");
exp("commands/information.js", "js-obf/commands/information.js");
exp("commands/player.js", "js-obf/commands/player.js");
exp("commands/plugins.js", "js-obf/commands/plugins.js");
exp("commands/scheduler.js", "js-obf/commands/scheduler.js");
exp("commands/server.js", "js-obf/commands/server.js");
exp("commands/world.js", "js-obf/commands/world.js");