# Running the Electron overlay in development

Step 1: Start Next.js web app
  cd .. (project root)
  npm run dev
  → running at http://localhost:3000

Step 2: Start Electron (separate terminal)
  cd electron
  npm install
  npm run start
  → Electron app launches, loads localhost:3000

Keyboard shortcuts:
  Cmd+Shift+H  → show/hide overlay
  Cmd+Shift+I  → toggle interactive/passthrough mode
  Cmd+Shift+P  → toggle always-on-top

The overlay is INVISIBLE to screen share by default.
To interact with it: press Cmd+Shift+I to enter interactive mode.
Press again to go back to passthrough mode.
