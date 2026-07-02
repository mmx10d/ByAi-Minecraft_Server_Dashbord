// استيراد كافة الموديلات التي قمنا ببنائها
const serverManager = require('./commands/server.js');
const playerManager = require('./commands/player.js');
const worldManager = require('./commands/world.js');
const infoManager = require('./commands/information.js');
const hostManager = require('./commands/host.js');

// تصدير واجهة موحدة تجمع كل الميزات
module.exports = {
  server: serverManager,
  player: playerManager,
  world: worldManager,
  info: infoManager,
  host: hostManager
};
