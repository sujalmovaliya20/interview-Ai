export {};

declare global {
  interface Window {
    electronAPI: {
      openExternal: (url: string) => void;
      // Add other electron APIs exposed via contextBridge here if needed
    };
  }
}
