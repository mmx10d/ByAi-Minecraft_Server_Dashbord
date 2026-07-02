const serverManager = require('./commands/server.js');
const playerManager = require('./commands/player.js');
const worldManager = require('./commands/world.js');
const infoManager = require('./commands/information.js');
const hostManager = require('./commands/host.js');

// الميزات الجديدة الشبيهة بـ Aternos
const pluginManager = require('./commands/plugins.js');
const backupManager = require('./commands/backup.js');
const schedulerManager = require('./commands/scheduler.js');

module.exports = {
  server: serverManager,
  player: playerManager,
  world: worldManager,
  info: infoManager,
  host: hostManager,
  plugins: pluginManager,
  backup: backupManager,
  scheduler: schedulerManager
};
