import { spawn } from "child_process"
import { fileURLToPath } from 'url';
import path from "path"


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function StartServer(Ram = "2G", JarName="paper.jar"){
  const JarPath = path.join(__dirname, JarName);

  console.log(`جاري تشغيل السيرفر بحجم :${Ram}`);

  serverProcess = spawn('java', [
    `-Xmx${ram}`,
    `-Xms${ram}`,
    '-jar',
    jarPath,
    'nogui'
  ]);


  serverProcess.stdout.on('data', (data) => {
    console.log(`[Minecraft]: ${data.toString().trim()}`);
  });


  serverProcess.stderr.on('data', (data) => {
    console.error(`[Error]: ${data.toString().trim()}`);
  });


  serverProcess.on('close', (code) => {
    console.log(`[Node] تم إغلاق سيرفر ماينكرافت بكود خروج: ${code}`);
    serverProcess = null;
  });

  export function sendCommand(command) {
    if (!serverProcess) {
      console.log('[Node] السيرفر غير يعمل حالياً لإرسال الأوامر.');
      return;
    }
    serverProcess.stdin.write(command.endsWith('\n') ? command : `${command}\n`);
  }
}