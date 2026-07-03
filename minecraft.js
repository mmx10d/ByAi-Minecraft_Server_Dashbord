// ========================================================
// 📦 [Aggregator Core: minecraft.js - Rebuilt & Verified]
// Central Orchestration Link for Sandboxed Server Management
// ========================================================

const serverManager = require('./commands/server.js');
const playerManager = require('./commands/player.js');
const worldManager = require('./commands/world.js');
const infoManager = require('./commands/information.js');
const hostManager = require('./commands/host.js');
const backupManager = require('./commands/backup.js');
const schedulerManager = require('./commands/scheduler.js');
const fileManager = require('./commands/files.js');

module.exports = {
  server: serverManager,
  player: playerManager,
  world: worldManager,
  info: infoManager,
  host: hostManager,
  backup: backupManager,
  scheduler: schedulerManager,
  files: fileManager
};
