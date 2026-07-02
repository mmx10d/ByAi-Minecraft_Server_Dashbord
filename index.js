// ========================================================
// 🚀 [Master Orchestrator: index.js - Part 1 of 2]
// Sandboxed Subsystem Core, Live Port Handlers, & Streaming
// ========================================================

const minecraft = require('./minecraft.js');
const { WebSocketServer } = require('ws');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

console.log('========================================================');
console.log(' ⚡ [نظام النواة السحابي الحديدي - Sandbox Core v2] يعمل... ');
console.log('========================================================');

// 1. Fire up and boot the Minecraft Java process automatically
minecraft.server.startServer();

// 2. Launch the standalone central WebSocket server on port 8080
const wss = new WebSocketServer({ port: 8080 });
console.log('[Socket Server]: يستمع الآن بأمان على الرابط: ws://localhost:8080');

// 3. Bind live log streams and broadcast them instantly as unified JSON packets
minecraft.server.setLogListener((logLine) => {
  // Dynamically maintain player count and connection status via pure RegEx filters
  minecraft.info.parseServerLog(logLine);

  const logPackage = JSON.stringify({
    type: 'LOG',
    data: logLine
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN connection check
      client.send(logPackage);
    }
  });
});
// ========================================================
// 🚀 [Master Orchestrator: index.js - Part 2 of 2]
// Secure Sandbox Action Handler, Binary Streaming & Maintenance
// ========================================================

// 4. Listen for oncoming connections and route JSON packages safely
wss.on('connection', (ws) => {
  console.log('[Socket Server]: A new administrative client has synchronized with the backend.');
  ws.send(JSON.stringify({ type: 'SYSTEM', data: 'Connected to Sandboxed Minecraft Backend v2' }));

  ws.on('message', async (message) => {
    try {
      const request = JSON.parse(message.toString());
      const { action, payload } = request;

      switch (action) {
        // ---- A) Power & Execution Control ----
        case 'START_SERVER':
          minecraft.server.startServer();
          break;
        case 'STOP_SERVER':
          minecraft.server.stopServer();
          break;
        case 'RESTART_SERVER':
          minecraft.server.restartServer();
          break;
        case 'MINECRAFT_COMMAND':
          minecraft.server.executeCommand(payload.command);
          break;

        // ---- B) Host Resource Analytics & Configuration Sync ----
        case 'GET_HOST_STATS':
          ws.send(JSON.stringify({
            type: 'HOST_STATS',
            data: {
              status: minecraft.info.getServerStatus(),
              ram: minecraft.host.getRamUsage(),
              cpu: minecraft.host.getCpuUsage(),
              playersCount: minecraft.info.getOnlinePlayersList().length,
              playersOnline: minecraft.info.getOnlinePlayersList(),
              opsList: minecraft.info.getOpsList(),
              whitelistList: minecraft.info.getWhitelistList(),
              bannedPlayersList: minecraft.info.getBannedPlayersList(),
              bannedIpsList: minecraft.info.getBannedIpsList(),
              serverProperties: minecraft.world.getAllProperties()
            }
          }));
          break;

        // ---- C) Detailed Advanced Player Profiling ----
        case 'GET_PLAYER_ADVANCED_DATA':
          const advancedData = minecraft.info.getPlayerDataDetails(payload.playerName);
          ws.send(JSON.stringify({
            type: 'PLAYER_ADVANCED_DATA',
            data: advancedData
          }));
          break;

        // ---- D) Server Properties Engine (Hardened max-players handling) ----
        case 'UPDATE_SERVER_PROPERTY':
          let successProp = false;
          if (payload.key === 'max-players') {
            successProp = minecraft.world.setMaxPlayers(payload.value);
          } else {
            successProp = minecraft.world.updateProperty(payload.key, payload.value);
          }
          ws.send(JSON.stringify({ type: 'PROPERTY_UPDATED_STATUS', success: successProp, key: payload.key }));
          break;
        case 'SET_GAMEMODE_SETTING':
          minecraft.world.changeGamemode(payload.mode);
          break;
        case 'SET_DIFFICULTY_SETTING':
          minecraft.world.changeDifficulty(payload.difficulty);
          break;
        case 'SET_WHITELIST_TOGGLE':
          minecraft.world.setWhitelistEnabled(payload.enable);
          break;
        case 'SET_CRACK_TOGGLE':
          minecraft.world.setCrackAllowed(payload.allowed);
          break;
        case 'RECREATE_FRESH_WORLD':
          const successRecreate = minecraft.world.recreateFreshWorld();
          ws.send(JSON.stringify({ type: 'WORLD_RECREATE_STATUS', success: successRecreate }));
          break;

        // ---- E) World Map Backup Generation (.zip) ----
        case 'CREATE_ZIP_BACKUP':
          ws.send(JSON.stringify({ type: 'BACKUP_STATUS', status: 'PROCESSING', msg: 'Zipping world directory...' }));
          const zipPath = await minecraft.backup.createZipBackup();
          if (zipPath) {
            const fileBuffer = fs.readFileSync(zipPath);
            ws.send(JSON.stringify({
              type: 'BACKUP_ZIP_DOWNLOAD',
              fileName: path.basename(zipPath),
              fileData: fileBuffer.toString('base64')
            }));
          } else {
            ws.send(JSON.stringify({ type: 'BACKUP_STATUS', status: 'FAILED', msg: 'Failed to create compressed map file.' }));
          }
          break;

        // ---- F) Sandbox File Explorer Subsystem ----
        case 'BROWSE_SERVER_DIRECTORY':
          const dirItems = minecraft.files.browseDirectory(payload.relativePath, payload.isPluginArea);
          ws.send(JSON.stringify({
            type: 'DIRECTORY_ITEMS_DATA',
            currentPath: payload.relativePath,
            isPluginArea: payload.isPluginArea || false,
            items: dirItems
          }));
          break;
        case 'READ_FILE_TEXT_CONTENT':
          const fileReadResult = minecraft.files.readFileContent(payload.relativePath, payload.isPluginArea);
          ws.send(JSON.stringify({ type: 'FILE_TEXT_CONTENT_DATA', relativePath: payload.relativePath, isPluginArea: payload.isPluginArea || false, ...fileReadResult }));
          break;
        case 'SAVE_FILE_TEXT_CONTENT':
          const saveSuccess = minecraft.files.saveFileContent(payload.relativePath, payload.content, payload.isPluginArea);
          ws.send(JSON.stringify({ type: 'FILE_SAVE_STATUS', relativePath: payload.relativePath, success: saveSuccess }));
          break;
        case 'UPLOAD_FILE_TO_SERVER':
          const uploadSuccess = minecraft.files.uploadFile(payload.relativePath, payload.fileData, true, payload.isPluginArea);
          ws.send(JSON.stringify({ type: 'FILE_UPLOAD_STATUS', relativePath: payload.relativePath, success: uploadSuccess }));
          break;
        case 'RENAME_FILE_OR_FOLDER':
          const renameSuccess = minecraft.files.renameFileOrFolder(payload.oldRelativePath, payload.newRelativePath, payload.isPluginArea);
          ws.send(JSON.stringify({ type: 'FILE_RENAME_STATUS', success: renameSuccess }));
          break;
        case 'DOWNLOAD_SINGLE_FILE':
          const downloadResult = minecraft.files.downloadSingleFile(payload.relativePath, payload.isPluginArea);
          if (downloadResult) {
            ws.send(JSON.stringify({
              type: 'SINGLE_FILE_DOWNLOAD_DATA',
              fileName: downloadResult.name,
              fileData: downloadResult.buffer.toString('base64')
            }));
          } else {
            ws.send(JSON.stringify({ type: 'SINGLE_FILE_DOWNLOAD_STATUS', success: false }));
          }
          break;
        case 'DELETE_FILE_OR_FOLDER':
          const deleteSuccess = minecraft.files.deleteFileOrFolder(payload.relativePath, payload.isPluginArea);
          ws.send(JSON.stringify({ type: 'FILE_DELETE_STATUS', relativePath: payload.relativePath, success: deleteSuccess }));
          break;

        default:
          ws.send(JSON.stringify({ type: 'ERROR', data: 'Unknown Action Received' }));
      }
    } catch (error) {
      minecraft.server.executeCommand(message.toString().trim());
    }
  });
});

// 5. Active Sleep Scheduler / Idle Proxy Checker (Runs safely every 60 seconds)
setInterval(() => {
  minecraft.scheduler.checkServerIdle();
}, 60000);

// 6. Direct Terminal Standard Input Hook for local master override commands
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (line) => { minecraft.world.executeCommand ? minecraft.world.executeCommand(line) : minecraft.server.executeCommand(line); });
