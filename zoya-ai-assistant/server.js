import express from 'express';
import { exec } from 'child_process';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
 
const SMART_APP_LABELS = {
  "whatsapp": "start whatsapp:",
  "spotify": "start spotify:",
  "discord": "start discord:",
  "slack": "start slack:",
  "netflix": "start netflix:",
  "messenger": "start msn-messenger:",
  "calculator": "calc",
  "word": "start winword",
  "excel": "start excel",
  "powerpoint": "start powerpnt",
  "powerpnt": "start powerpnt",
  "chrome": "start chrome",
  "edge": "start msedge",
  "code": "code",
  "notepad": "notepad"
};

// ============================================================
// VS CODE COMPLETE CONTROL ENDPOINT
// ============================================================
app.post('/vs-code-control', (req, res) => {
  const { action, parameter, parameter2 } = req.body;

  if (!action) return res.status(400).json({ error: 'Action is required' });

  let command = '';
  let message = '';

  switch (action) {

    // -----------------------------------------------------------
    // CREATE FOLDER (on Desktop or any path) and open in VS Code
    // -----------------------------------------------------------
    case 'create_folder': {
      const folderName = parameter || 'NewFolder';
      const location = parameter2 || `${process.env.USERPROFILE}\\Desktop`;
      const fullPath = path.join(location, folderName);

      try {
        fs.mkdirSync(fullPath, { recursive: true });
        // Open it in VS Code
        command = `code "${fullPath}"`;
        message = `Folder '${folderName}' created at ${location} and opened in VS Code!`;
      } catch (e) {
        return res.status(500).json({ error: `Failed to create folder: ${e.message}` });
      }
      break;
    }

    // -----------------------------------------------------------
    // OPEN ANY FOLDER / FILE IN VS CODE
    // -----------------------------------------------------------
    case 'open_in_vscode': {
      const targetPath = parameter || process.env.USERPROFILE + '\\Desktop';
      command = `code "${targetPath}"`;
      message = `Opened '${parameter}' in VS Code.`;
      break;
    }

    // -----------------------------------------------------------
    // RUN TERMINAL COMMAND INSIDE VS CODE (Integrated Terminal)
    // Opens VS Code with the given folder + runs command in its terminal
    // -----------------------------------------------------------
    case 'run_in_vscode_terminal': {
      const vsWorkDir = parameter  || (process.env.USERPROFILE + '\\Desktop');
      const vsTermCmd = (parameter2 || 'echo Hello from Zoya!').replace(/'/g, "''");

      // Open VS Code at folder, then open integrated terminal and run command
      const psLines = [
        `Start-Process 'code' -ArgumentList '"${vsWorkDir}"'`,
        `Start-Sleep -s 4`,
        `$wshell = New-Object -ComObject WScript.Shell`,
        `$attempts = 0`,
        `while ($attempts -lt 10) {`,
        `  $proc = Get-Process | Where-Object { $_.Name -like '*Code*' -and $_.MainWindowTitle -ne '' } | Select-Object -First 1`,
        `  if ($proc) { $wshell.AppActivate($proc.Id); Start-Sleep -ms 500; break }`,
        `  $attempts++; Start-Sleep -ms 500`,
        `}`,
        `Start-Sleep -ms 500`,
        `$wshell.SendKeys('^' + [char]96)`,
        `Start-Sleep -s 2`,
        `$wshell.SendKeys('${vsTermCmd}')`,
        `Start-Sleep -ms 300`,
        `$wshell.SendKeys('{ENTER}')`,
      ].join('; ');

      command = `powershell -NoProfile -Command "${psLines}"`;
      message = `Running '${parameter2}' in VS Code terminal at ${parameter}`;
      break;
    }

    // -----------------------------------------------------------
    // CREATE REACT APP (special case - more reliable)
    // -----------------------------------------------------------
    case 'create_react_app': {
      const appName   = parameter  || 'my-react-app';
      const location  = parameter2 || `${process.env.USERPROFILE}\\Desktop`;
      const fullPath  = path.join(location, appName);

      const chainedCommand = `npm create vite@latest . --yes -- --template react; npm install; New-Item -ItemType Directory -Force -Path src\\components, src\\pages; Set-Content -Path src\\App.jsx -Value "export default function App() { return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#00D8FF', fontFamily: 'monospace'}}><h1>Zoya Autonomous Build Successful!</h1></div> }"; Start-Process cmd -WindowStyle Hidden -ArgumentList '/c timeout 8 >nul && start http://localhost:5173'; npm run dev`;
      
      const smartScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WApi {
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    
    public static void ForceForeground(IntPtr hwnd) {
        keybd_event(0x12, 0, 0, 0);
        keybd_event(0x12, 0, 2, 0);
        ShowWindow(hwnd, 9);
        SetForegroundWindow(hwnd);
    }
}
"@;

New-Item -ItemType Directory -Force -Path "${fullPath}" | Out-Null;
Start-Process "code" -ArgumentList '"${fullPath}"';
Start-Sleep -s 6;

$hwnd = [IntPtr]::Zero;
for ($i=0; $i -lt 15; $i++) {
    $proc = Get-Process | Where-Object { $_.MainWindowTitle -like '*Visual Studio Code' } | Select-Object -First 1;
    if ($proc) {
        $hwnd = $proc.MainWindowHandle;
        break;
    }
    Start-Sleep -ms 500;
}

if ($hwnd -ne [IntPtr]::Zero) {
    [WApi]::ForceForeground($hwnd);
}
Start-Sleep -s 1;

$wshell = New-Object -ComObject WScript.Shell;
$wshell.SendKeys("{ENTER}");
Start-Sleep -s 1;

$wshell.SendKeys('^\`');
Start-Sleep -s 3;

$payload = @'
${chainedCommand}
'@;
Set-Clipboard -Value $payload;

$wshell.SendKeys("^v");
Start-Sleep -ms 500;
$wshell.SendKeys("{ENTER}");
`;
      const encodedScript = Buffer.from(smartScript, 'utf16le').toString('base64');
      command = `powershell -EncodedCommand ${encodedScript}`;
      message = `Zoya is establishing standard React architecture for '${appName}' inside VS Code terminal autonomously...`;
      break;
    }

    // -----------------------------------------------------------
    // CREATE NEXT.JS APP
    // -----------------------------------------------------------
    case 'create_nextjs_app': {
      const appName  = parameter  || 'my-next-app';
      const location = parameter2 || `${process.env.USERPROFILE}\\Desktop`;
      const fullPath = path.join(location, appName);

      const chainedCommand = `npx create-next-app@latest . --yes --ts --tailwind --eslint --app --src-dir --import-alias "@/*"; New-Item -ItemType Directory -Force -Path src\\components, src\\utils; Set-Content -Path src\\app\\page.tsx -Value "export default function Page() { return <div className='flex h-screen items-center justify-center bg-black text-pink-500 font-mono text-2xl'>Zoya Autonomous Next.js Build Successful!</div> }"; Start-Process cmd -WindowStyle Hidden -ArgumentList '/c timeout 18 >nul && start http://localhost:3000'; npm run dev`;

      const smartScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WApi {
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    
    public static void ForceForeground(IntPtr hwnd) {
        keybd_event(0x12, 0, 0, 0);
        keybd_event(0x12, 0, 2, 0);
        ShowWindow(hwnd, 9);
        SetForegroundWindow(hwnd);
    }
}
"@;

New-Item -ItemType Directory -Force -Path "${fullPath}" | Out-Null;
Start-Process "code" -ArgumentList '"${fullPath}"';
Start-Sleep -s 6;

$hwnd = [IntPtr]::Zero;
for ($i=0; $i -lt 15; $i++) {
    $proc = Get-Process | Where-Object { $_.MainWindowTitle -like '*Visual Studio Code' } | Select-Object -First 1;
    if ($proc) {
        $hwnd = $proc.MainWindowHandle;
        break;
    }
    Start-Sleep -ms 500;
}

if ($hwnd -ne [IntPtr]::Zero) {
    [WApi]::ForceForeground($hwnd);
}
Start-Sleep -s 1;

$wshell = New-Object -ComObject WScript.Shell;
$wshell.SendKeys("{ENTER}");
Start-Sleep -s 1;

$wshell.SendKeys('^\`');
Start-Sleep -s 3;

$payload = @'
${chainedCommand}
'@;
Set-Clipboard -Value $payload;

$wshell.SendKeys("^v");
Start-Sleep -ms 500;
$wshell.SendKeys("{ENTER}");
`;
      const encodedScript = Buffer.from(smartScript, 'utf16le').toString('base64');
      command = `powershell -EncodedCommand ${encodedScript}`;
      message = `Zoya is establishing standard Next.js architecture for '${appName}' inside VS Code terminal autonomously...`;
      break;
    }

    // -----------------------------------------------------------
    // RUN ANY COMMAND IN A NEW TERMINAL (at a given path)
    // -----------------------------------------------------------
    case 'run_command_at_path': {
      const workDir = parameter  || process.env.USERPROFILE + '\\Desktop';
      const termCmd = parameter2 || 'dir';
      command = `start cmd /k "cd /d "${workDir}" && ${termCmd}"`;
      message = `Running '${termCmd}' at ${workDir}`;
      break;
    }

    // -----------------------------------------------------------
    // INSTALL VS CODE EXTENSION
    // -----------------------------------------------------------
    case 'install_extension': {
      const extId = parameter || '';
      if (!extId) return res.status(400).json({ error: 'Extension ID is required' });
      command = `code --install-extension "${extId}"`;
      message = `Installing VS Code extension: ${extId}`;
      break;
    }

    // -----------------------------------------------------------
    // CREATE A NEW FILE IN VS CODE
    // -----------------------------------------------------------
    case 'new_file': {
      const filePath = parameter || `${process.env.USERPROFILE}\\Desktop\\newfile.txt`;
      try {
        fs.writeFileSync(filePath, '', { flag: 'a' }); // create if not exists
        command = `code "${filePath}"`;
        message = `Created and opened file: ${filePath}`;
      } catch (e) {
        return res.status(500).json({ error: `Failed to create file: ${e.message}` });
      }
      break;
    }

    // -----------------------------------------------------------
    // WRITE CODE TO FILE AND OPEN IN VS CODE
    // -----------------------------------------------------------
    case 'write_code_to_file': {
      const filePath = parameter || `${process.env.USERPROFILE}\\Desktop\\code.txt`;
      const codeContent = parameter2 || '';
      try {
        fs.writeFileSync(filePath, codeContent, { encoding: 'utf8' });
        command = `code "${filePath}"`;
        message = `Wrote code to ${filePath} and opened in VS Code.`;
      } catch (e) {
        return res.status(500).json({ error: `Failed to write code to file: ${e.message}` });
      }
      break;
    }

    // -----------------------------------------------------------
    // FORMAT DOCUMENT IN VS CODE (keyboard shortcut)
    // -----------------------------------------------------------
    case 'format_document': {
      const fmtLines = [
        `$wshell = New-Object -ComObject WScript.Shell`,
        `$proc = Get-Process | Where-Object { $_.Name -like '*Code*' -and $_.MainWindowTitle -ne '' } | Select-Object -First 1`,
        `if ($proc) { $wshell.AppActivate($proc.Id); Start-Sleep -ms 500; $wshell.SendKeys('+%f') }`,
      ].join('; ');
      command = `powershell -NoProfile -Command "${fmtLines}"`;
      message = 'Formatting document in VS Code!';
      break;
    }

    // -----------------------------------------------------------
    // OPEN VS CODE TERMINAL ONLY (Ctrl+`)
    // -----------------------------------------------------------
    case 'open_terminal': {
      // Use [char]96 for backtick to avoid JS template literal conflicts
      const termLines = [
        `$wshell = New-Object -ComObject WScript.Shell`,
        `$proc = Get-Process | Where-Object { $_.Name -like '*Code*' -and $_.MainWindowTitle -ne '' } | Select-Object -First 1`,
        `if ($proc) { $wshell.AppActivate($proc.Id); Start-Sleep -ms 500; $wshell.SendKeys('^' + [char]96) }`,
      ].join('; ');
      command = `powershell -NoProfile -Command "${termLines}"`;
      message = 'Opening VS Code integrated terminal!';
      break;
    }

    // -----------------------------------------------------------
    // CLOSE VS CODE
    // -----------------------------------------------------------
    case 'close_vscode': {
      command = `powershell -Command "Get-Process | Where-Object { $_.Name -like '*Code*' } | Stop-Process -Force -ErrorAction SilentlyContinue"`;
      message = 'Closing VS Code.';
      break;
    }

    // -----------------------------------------------------------
    // SPLIT EDITOR IN VS CODE
    // -----------------------------------------------------------
    case 'split_editor': {
      const splitLines = [
        `$wshell = New-Object -ComObject WScript.Shell`,
        `$proc = Get-Process | Where-Object { $_.Name -like '*Code*' -and $_.MainWindowTitle -ne '' } | Select-Object -First 1`,
        `if ($proc) { $wshell.AppActivate($proc.Id); Start-Sleep -ms 500; $wshell.SendKeys('^\\') }`,
      ].join('; ');
      command = `powershell -NoProfile -Command "${splitLines}"`;
      message = 'Splitting editor in VS Code!';
      break;
    }

    default:
      return res.status(400).json({ error: `Unknown VS Code action: ${action}` });
  }

  exec(command, (error) => {
    if (error) {
      console.warn(`VS Code control [${action}] error: ${error.message}`);
      // Some commands like open terminal return non-zero but still work
      if (action === 'format_document' || action === 'open_terminal' || action === 'split_editor') {
        return res.json({ message });
      }
      return res.status(500).json({ error: `Failed to execute VS Code action: ${action}. Error: ${error.message}` });
    }
    res.json({ message });
  });
});


// ============================================================
// EXISTING ENDPOINTS (unchanged)
// ============================================================

// YouTube Auto-Play: Fetches the first search result and opens it directly
app.post('/play-youtube', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const options = {
    hostname: 'www.youtube.com',
    path: `/results?search_query=${encodeURIComponent(query)}`,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  };

  https.get(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      const match = data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match && match[1]) {
        const videoId = match[1];
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}&autoplay=1`;
        exec(`start "" "${videoUrl}"`, (error) => {
          if (error) {
            console.error('Error opening video:', error);
            return res.status(500).json({ error: 'Failed to open video' });
          }
          res.json({ message: `Now playing: ${query}` });
        });
      } else {
        exec(`start "" "${searchUrl}"`, () => {});
        res.json({ message: `Opened YouTube search for: ${query}` });
      }
    });
  }).on('error', () => {
    exec(`start "" "${searchUrl}"`, () => {});
    res.json({ message: `Opened YouTube for: ${query}` });
  });
});

app.post('/open-app', (req, res) => {
  const { appName } = req.body;
  if (!appName) return res.status(400).json({ error: "App name is required" });
  
  const normalizedName = appName.toLowerCase();
  console.log(`Attempting to open: ${normalizedName}`);

  let command = SMART_APP_LABELS[normalizedName] || `start ${appName}`;
  
  exec(command, (error) => {
    if (error) {
      console.error(`Error opening app [${appName}]: ${error}`);
      return res.status(500).json({ error: `Failed to open ${appName}. It might not be installed.` });
    }
    res.json({ message: `Successfully opened ${appName}` });
  });
});

app.post("/close-app", (req, res) => {
  const { appName } = req.body;
  if (!appName) {
    return res.status(400).json({ error: "App name is required" });
  }

  if (appName.toLowerCase() === "explorer" || appName.toLowerCase() === "file explorer") {
    const cmd = `powershell -Command "(New-Object -ComObject Shell.Application).Windows() | Where-Object { $_.Name -eq 'File Explorer' -or $_.Name -eq 'Windows Explorer' } | ForEach-Object { $_.Quit() }"`;
    exec(cmd, () => {
      res.json({ message: `Successfully requested all File Explorer windows to close.` });
    });
    return;
  }

  let processName = appName.toLowerCase().endsWith(".exe") ? appName : `${appName}.exe`;
  
  if (appName.toLowerCase() === "chrome" || appName.toLowerCase() === "google chrome") {
    const smartChromeClose = `powershell -Command "Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne '' -and $_.MainWindowTitle -notlike '*localhost*' } | ForEach-Object { $_.CloseMainWindow() | Out-Null }"`;
    exec(smartChromeClose, () => {
      res.json({ message: "Closed Chrome windows (kept the project open)." });
    });
    return;
  }
  
  let killCmd = `taskkill /F /IM ${processName}`;
  if (appName.toLowerCase() === "whatsapp") {
    killCmd = `powershell -Command "Get-Process | Where-Object { $_.Name -like '*WhatsApp*' } | Stop-Process -Force -ErrorAction SilentlyContinue"`;
  }

  exec(killCmd, (error) => {
    if (error && !killCmd.includes("Stop-Process")) {
      console.error(`Error closing app: ${error}`);
      return res.status(500).json({ error: `Failed to close ${appName}. It might not be running.` });
    }
    res.json({ message: `Successfully requested ${appName} to close.` });
  });
});

app.post("/open-url", (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  exec(`start "" "${url}"`, (error) => {
    if (error) {
      console.error(`Error opening URL: ${error}`);
      return res.status(500).json({ error: "Failed to open URL" });
    }
    res.json({ message: `Opened URL: ${url}` });
  });
});

// Unified System Control Endpoint
app.post("/system-control", (req, res) => {
  const { action, parameter } = req.body;
  
  let command = "";
  let message = "";

  switch (action) {
    case "volume_up":
      command = `powershell -Command "(new-object -com wscript.shell).SendKeys([char]175)"`;
      message = "Increasing volume.";
      break;
    case "volume_down":
      command = `powershell -Command "(new-object -com wscript.shell).SendKeys([char]174)"`;
      message = "Decreasing volume.";
      break;
    case "volume_mute":
      command = `powershell -Command "(new-object -com wscript.shell).SendKeys([char]173)"`;
      message = "Toggling mute.";
      break;
    case "brightness":
      const level = parameter || 50;
      command = `powershell -Command "(Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${level})"`;
      message = `Setting brightness to ${level}%.`;
      break;
    case "clear_recycle_bin":
      command = `powershell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"`;
      message = "Recycle Bin cleared.";
      break;
    case "sleep":
      command = `rundll32.exe powrprof.dll,SetSuspendState 0,1,0`;
      message = "Putting system to sleep.";
      break;
    case "restart":
      command = `shutdown /r /t 0`;
      message = "Restarting system.";
      break;
    case "shutdown":
      command = `shutdown /s /t 0`;
      message = "Shutting down system.";
      break;
    case "open_path": {
      let rawPath = parameter || "shell:MyComputerFolder";
      const escapedPath = rawPath.replace(/'/g, "''");
      // String concatenation keeps '} else {' together — no semicolons between } and else
      const psScript =
        "$path = '" + escapedPath + "'; " +
        "if ($path.StartsWith('shell:')) { " +
          "Start-Process 'explorer.exe' -ArgumentList $path " +
        "} else { " +
          "if (-not (Test-Path -LiteralPath $path)) { New-Item -ItemType Directory -Force -Path $path | Out-Null }; " +
          "$shell = New-Object -ComObject Shell.Application; " +
          "$window = $shell.Windows() | Where-Object { $_.Name -eq 'File Explorer' -or $_.Name -eq 'Windows Explorer' } | Select-Object -First 1; " +
          "if ($window) { $window.Navigate2($path) } else { Start-Process 'explorer.exe' -ArgumentList $path }" +
        "}";
      command = "powershell -NoProfile -Command \"" + psScript + "\"";
      message = "Navigating to: " + rawPath;
      break;
    }
    case "close_explorer":
      command = `powershell -Command "(New-Object -ComObject Shell.Application).Windows() | Where-Object { $_.Name -eq 'File Explorer' -or $_.Name -eq 'Windows Explorer' } | ForEach-Object { $_.Quit() }"`;
      message = "Closing all File Explorer windows gracefully.";
      break;
    case "smart_whatsapp_send": {
      const contactData = parameter || "";
      const [targetName, ...msgData] = contactData.split('|');
      const finalMsg = msgData.join('|');
      
      const safeTarget = targetName.replace(/'/g, "''");
      const safeMsg = finalMsg.replace(/'/g, "''");

      const smartScript = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WApi {
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    
    public static void ForceForeground(IntPtr hwnd) {
        keybd_event(0x12, 0, 0, 0);
        keybd_event(0x12, 0, 2, 0);
        ShowWindow(hwnd, 9);
        SetForegroundWindow(hwnd);
    }
}
"@;

Start-Process "whatsapp:";
Start-Sleep -s 6;

$hwnd = [WApi]::FindWindow($null, "WhatsApp");
if ($hwnd -ne [IntPtr]::Zero) {
    [WApi]::ForceForeground($hwnd);
}
Start-Sleep -s 1;

$wshell = New-Object -ComObject WScript.Shell;
$wshell.SendKeys("^n");
Start-Sleep -s 2;
Set-Clipboard -Value '${safeTarget}';
$wshell.SendKeys("^v");
Start-Sleep -s 4;

$wshell.SendKeys("{DOWN}");
Start-Sleep -ms 500;
$wshell.SendKeys("{ENTER}");
Start-Sleep -s 2;

Set-Clipboard -Value '${safeMsg}';
$wshell.SendKeys("^v");
Start-Sleep -ms 500;
$wshell.SendKeys("{ENTER}");
`;
      const encodedScript = Buffer.from(smartScript, 'utf16le').toString('base64');
      command = `powershell -EncodedCommand ${encodedScript}`;
      message = `Initiating Smart Message Link for ${targetName}...`;
      break;
    }
    default:
      return res.status(400).json({ error: "Invalid action" });
  }

  exec(command, (error) => {
    if (error) {
      console.warn(`System control [${action}] returned code/error: ${error.message}`);
      if (action !== "open_path" && action !== "close_explorer") {
        return res.status(500).json({ error: `Failed to execute ${action}` });
      }
    }
    res.json({ message });
  });
});

app.listen(port, () => {
  console.log(`System Bridge Server listening at http://localhost:${port}`);
});
