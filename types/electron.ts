export interface TitleUpdateEvent {
  id: number;
  title: string;
}

export interface FaviconUpdateEvent {
  id: number;
  favicon: string;
}

export interface Tab {
  id: number;
  url: string;
  title?: string;
  favicon?: string;
}

// Define the shape of the IPC renderer interface
export interface IpcRenderer {
  send: (channel: string, data: any) => void;
  on: (
    channel: string,
    listener: (event: unknown, ...args: any[]) => void
  ) => void;
  removeAllListeners: (channel: string) => void;
}

// Define the shape of the electron window object
declare global {
  interface Window {
    electron?: {
      ipcRenderer: IpcRenderer;
    };
  }
}
