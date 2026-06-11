import type { ForgeConfig } from '@electron-forge/shared-types'

const config: ForgeConfig = {
  packagerConfig: {
    name: 'SystemHelper',
    executableName: 'systemhelper',
    icon: './src/assets/icon',
    appBundleId: 'com.interviewai.overlay',
    appCategoryType: 'public.app-category.productivity',
    // Mac: hide from dock
    extendInfo: {
      LSUIElement: true,  // hides from Dock and App Switcher on Mac
      NSMicrophoneUsageDescription: 'Microphone access for audio capture',
      NSScreenCaptureDescription: 'Screen recording for system audio capture'
    },
    // Security: no asar unpacking issues
    asar: true,
    protocols: [
      {
        name: 'InterviewAI Protocol',
        schemes: ['interviewai']
      }
    ]
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: { name: 'SystemHelper' }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        name: 'SystemHelper'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
      config: {}
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        port: 3002,
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/renderer/toolbar.html',
              js: './src/renderer/toolbar.ts',
              name: 'toolbar',
              preload: { js: './src/preload.ts' }
            },
            {
              html: './src/renderer/answer.html',
              js: './src/renderer/answer.ts',
              name: 'answer_panel',
              preload: { js: './src/preload.ts' }
            }
          ]
        }
      }
    }
  ]
}

export default config
