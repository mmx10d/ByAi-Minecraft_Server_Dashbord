const { executeCommand } = require('./server.js');
const fs = require('fs');
const path = require('path');

const propertiesPath = path.join(__dirname, '../server.properties');

// مصفوفة داخلية لتخزين أسماء اللاعبين أونلاين بشكل حي ومستقر
let isServerOnline = false;
let onlinePlayersList = [];

/**
 * دالة ذكية جداً تعتمد على الـ RegEx لتحليل الكونسل ورصد اللاعبين بدقة
 * @param {string} logLine - السطر القادم من مخرجات السيرفر (stdout)
 */
function parseServerLog(logLine) {
  // 1. التحقق من حالة السيرفر العامة
  if (logLine.includes('Done') && logLine.includes('For help, type "help"')) {
    isServerOnline = true;
  }
  if (logLine.includes('Closing Server') || logLine.includes('Stopping server')) {
    isServerOnline = false;
    onlinePlayersList = [];
  }

  // 2. فحص رصد دخول اللاعبين الفعلي عبر النمط العالمي
  if (logLine.includes('joined the game')) {
    // نمط RegEx يبحث عن أي نص يقع قبل كلمة joined the game مباشرة وينظفه من بيانات الوقت والـ INFO
    const joinMatch = logLine.match(/([a-zA-Z0-9_]+)\s+joined the game/);
    if (joinMatch && joinMatch[1]) {
      const playerName = joinMatch[1].trim();
      if (!onlinePlayersList.includes(playerName)) {
        onlinePlayersList.push(playerName);
        console.log(`[Smart Tracker]: تم رصد دخول حقيقي للاعب: ${playerName}`);
      }
    }
  }

  // 3. فحص رصد خروج اللاعبين الفعلي عبر النمط العالمي
  if (logLine.includes('left the game')) {
    const leaveMatch = logLine.match(/([a-zA-Z0-9_]+)\s+left the game/);
    if (leaveMatch && leaveMatch[1]) {
      const playerName = leaveMatch[1].trim();
      onlinePlayersList = onlinePlayersList.filter(name => name !== playerName);
      console.log(`[Smart Tracker]: تم رصد خروج حقيقي للاعب: ${playerName}`);
    }
  }
}

/**
 * دالة لمعرفة حالة السيرفر الحالية
 */
function getServerStatus() {
  return isServerOnline ? 'ONLINE' : 'OFFLINE';
}

/**
 * دالة لجلب الحد الأقصى للاعبين
 */
function getTotalPlayers() {
  if (!fs.existsSync(propertiesPath)) return 20;
  try {
    const content = fs.readFileSync(propertiesPath, 'utf8');
    const lines = content.split('\n');
    for (let line of lines) {
      if (line.trim().startsWith('max-players=')) {
        return parseInt(line.split('=')[1].trim(), 10) || 20;
      }
    }
  } catch (error) {
    console.error('[Information Manager ERROR]:', error);
  }
  return 20;
}

/**
 * دالة جوهرية لملف index.js وبوت تلجرام لإرجاع قائمة اللاعبين الفعليين حالياً
 * @returns {Array<string>} مصفوفة بأسماء اللاعبين الفعليين
 */
function getOnlinePlayersList() {
  return onlinePlayersList;
}

module.exports = {
  parseServerLog,
  getServerStatus,
  getTotalPlayers,
  getOnlinePlayersList
};
