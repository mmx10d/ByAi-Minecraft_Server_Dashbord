const minecraft = require('./minecraft.js');
const { spawn } = require('child_process');

console.log('=== [نظام إدارة ماين كرافت عبر Node.js] ===');

// 1. تشغيل السيرفر
minecraft.server.startServer();

// 2. ربط مخرجات السيرفر الحية بمحلل البيانات في معلومات الخادم
// قمنا بتعديل دالة startServer داخلياً في السيرفر لترسل الـ logs هنا
// لتشغيل المحلل تلقائياً، سنقوم بإنصات بسيط لمخرجات العملية (إن وجدت)
setTimeout(() => {
  // عرض مواصفات بيئة التشغيل في الكونسل عند الإقلاع للترحيب بك
  console.log(`\n[Host Info]: يعمل على جهاز: ${minecraft.host.getHostName()}`);
  console.log(`[Host Info]: نظام التشغيل: ${minecraft.host.getFullHostName()}`);
  console.log(`[Host Info]: استهلاك الرام الحالي للجهاز: ${minecraft.host.getRamUsage()}`);
  console.log(`[Host Info]: البورت المحجوز للسيرفر: ${minecraft.host.getPortNumber()}\n`);
}, 3000);

// مثال لكيفية استخدام الأوامر برمجياً في مشروعك مستقبلاً:
// يمكنك تجربة فك التعليق عن الأسطر بالأسفل لاختبارها بعد إقلاع السيرفر تماماً:
/*
setTimeout(() => {
    console.log('--- تجربة تغيير الإعدادات تلقائياً ---');
    minecraft.world.changeGamemode('creative'); // تغيير الوضع الافتراضي لـ كرييتف
    minecraft.world.setMaxPlayers(50); // رفع الحد الأقصى للاعبين لـ 50
}, 15000);
*/
