const { execSync } = require('child_process')
const path = require('path')
const os = require('os')
const fs = require('fs')

if (os.platform() !== 'win32') {
  console.log('Not Windows — skipping protocol registration')
  process.exit(0)
}

console.log('Registering interviewai:// protocol on Windows...')

// Find electron executable in node_modules
const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron.cmd')
const mainScript = path.join(__dirname, '..', 'src', 'main.ts')

// Check if electron exists
if (!fs.existsSync(electronPath)) {
  console.error('electron not found at:', electronPath)
  console.error('Run: cd electron && npm install')
  process.exit(1)
}

const command = `"${electronPath.replace(/\\/g, '\\\\')}" "${mainScript.replace(/\\/g, '\\\\')}"`

try {
  // Register in HKCU (no admin needed)
  const regBase = 'HKCU\\Software\\Classes\\interviewai'

  execSync(`REG ADD "${regBase}" /ve /d "URL:InterviewAI Protocol" /f`, { stdio: 'pipe' })
  execSync(`REG ADD "${regBase}" /v "URL Protocol" /d "" /f`, { stdio: 'pipe' })
  execSync(`REG ADD "${regBase}\\DefaultIcon" /ve /d "${electronPath},1" /f`, { stdio: 'pipe' })
  execSync(`REG ADD "${regBase}\\shell\\open\\command" /ve /d "\\"${command}\\" \\"%1\\"" /f`, { stdio: 'pipe' })

  console.log('✓ Protocol registered successfully')
  console.log('  interviewai:// will now open the Electron app')
  console.log('  Restart Electron for changes to take effect')
} catch (err) {
  console.error('✗ Registration failed:', err.message)
  console.log('')
  console.log('Manual fix — run this in PowerShell as Admin:')
  console.log(`  REG ADD "HKCU\\Software\\Classes\\interviewai" /ve /d "URL:InterviewAI Protocol" /f`)
  console.log(`  REG ADD "HKCU\\Software\\Classes\\interviewai" /v "URL Protocol" /d "" /f`)
  console.log(`  REG ADD "HKCU\\Software\\Classes\\interviewai\\shell\\open\\command" /ve /d "\\"${command}\\" \\"%1\\"" /f`)
}
