"use client";

import { useState, useEffect } from "react";
import TabSidebar from "@/components/Sidebar";
import AddressBar from "@/components/AddressBar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import type {
  TitleUpdateEvent,
  FaviconUpdateEvent,
  IpcRenderer,
} from "@/types/electron";

// Move Electron import into a client-side only context with proper typing
let ipcRenderer: IpcRenderer | null = null;
if (typeof window !== "undefined") {
  ipcRenderer = window.electron?.ipcRenderer ?? null;
}

interface Tab {
  id: number;
  url: string;
  title?: string;
  favicon?: string;
}

export default function Home() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, url: "https://www.google.com" },
  ]);
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    // Create initial tab
    ipcRenderer?.send("create-tab", {
      id: 1,
      url: "https://www.google.com",
    });

    // Listen for page updates with proper types
    ipcRenderer?.on("page-title-updated", (param: any) => {
      if (
        param &&
        typeof param === "object" &&
        "id" in param &&
        "title" in param &&
        typeof param.title === "string"
      ) {
        setTabs((tabs) =>
          tabs.map((tab) =>
            tab.id === param.id ? { ...tab, title: param.title as string } : tab
          )
        );
      }
    });

    ipcRenderer?.on("page-favicon-updated", (param: any) => {
      if (
        param &&
        typeof param === "object" &&
        "id" in param &&
        "favicon" in param &&
        typeof param.favicon === "string"
      ) {
        setTabs((tabs) =>
          tabs.map((tab) =>
            tab.id === param.id
              ? { ...tab, favicon: param.favicon as string }
              : tab
          )
        );
      }
    });

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      ipcRenderer?.send("toggle-devtools", { id: activeTab });
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      ipcRenderer?.removeAllListeners("page-title-updated");
      ipcRenderer?.removeAllListeners("page-favicon-updated");
    };
  }, [activeTab]);

  const handleNewTab = () => {
    const id = Date.now();
    const newTab = { id, url: "https://www.google.com" };
    setTabs([...tabs, newTab]);
    setActiveTab(id);
    ipcRenderer?.send("create-tab", {
      id,
      url: "https://www.google.com",
    });
  };

  const handleSwitchTab = (id: number) => {
    setActiveTab(id);
    ipcRenderer?.send("switch-tab", { id });
  };

  const handleCloseTab = (id: number) => {
    const newTabs = tabs.filter((tab) => tab.id !== id);
    if (newTabs.length === 0) {
      handleNewTab();
    } else if (activeTab === id) {
      setActiveTab(newTabs[0].id);
      ipcRenderer?.send("switch-tab", { id: newTabs[0].id });
    }
    setTabs(newTabs);
    ipcRenderer?.send("close-tab", { id });
  };

  const handleNavigate = (url: string) => {
    ipcRenderer?.send("navigate", { id: activeTab, url });
    setTabs(tabs.map((tab) => (tab.id === activeTab ? { ...tab, url } : tab)));
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        {/* Test component with basic colors */}
        <div className="fixed top-4 right-4 z-50 p-4 bg-red-500 text-white font-bold rounded-lg shadow-lg">
          Tailwind Test
        </div>
        <div className="fixed top-20 right-4 z-50 p-4 bg-green-500 text-white font-bold rounded-lg shadow-lg">
          Another Test
        </div>
        <TabSidebar
          tabs={tabs}
          activeTab={activeTab}
          onNewTab={handleNewTab}
          onSwitchTab={handleSwitchTab}
          onCloseTab={handleCloseTab}
        />
        <SidebarInset className="flex flex-col flex-grow">
          <AddressBar
            url={activeTabData?.url || ""}
            onNavigate={handleNavigate}
          />
          <div className="flex-1" style={{ minHeight: 0 }}>
            {/* Chromium content rendered here by Electron */}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
