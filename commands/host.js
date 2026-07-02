// ========================================================
// 📟 [محرك host.js المطور - حساب نبضات المعالج الحقيقي والرام]
// ========================================================

const os = require('os');

/**
 * دالة مساعدة لأخذ لقطة تفصيلية لنبضات وقت المعالج حالياً
 */
function getCpuTimeSnapshot() {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return { idle: 0, total: 0 };

  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

// أخذ اللقطة الأولى عند إقلاع الملف برمجياً
let lastCpuSnapshot = getCpuTimeSnapshot();
let currentCpuUsagePercentage = "0.00%";

// جدولة داخلية كل ثانيتين لحساب فرق النبضات وتحديث النسبة بدقة مطلقة
setInterval(() => {
  const currentSnapshot = getCpuTimeSnapshot();

  const idleDifference = currentSnapshot.idle - lastCpuSnapshot.idle;
  const totalDifference = currentSnapshot.total - lastCpuSnapshot.total;

  if (totalDifference > 0) {
    const usage = 100 - Math.round((100 * idleDifference) / totalDifference);
    currentCpuUsagePercentage = `${Math.max(0, usage).toFixed(2)}%`;
  }

  lastCpuSnapshot = currentSnapshot;
}, 2000);

/**
 * جلب نسبة استهلاك المعالج الحقيقية (المصلحة تماماً من الـ 0.00%)
 */
function getCpuUsage() {
  return currentCpuUsagePercentage;
}

/**
 * jلب نسبة استهلاك الذاكرة العشوائية (RAM) لجهاز الاستضافة
 */
function getRamUsage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const percentage = (usedMemory / totalMemory) * 100;
  return `${percentage.toFixed(2)}%`;
}

module.exports = {
  getCpuUsage,
  getRamUsage
};
