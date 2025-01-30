"use client";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

interface Tab {
  id: number;
  url: string;
  title?: string;
  favicon?: string;
}

interface SidebarProps {
  tabs: Tab[];
  activeTab: number;
  onNewTab: () => void;
  onSwitchTab: (id: number) => void;
  onCloseTab: (id: number) => void;
}

export default function TabSidebar({
  tabs,
  activeTab,
  onNewTab,
  onSwitchTab,
  onCloseTab,
}: SidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-2">
        <Button
          onClick={onNewTab}
          variant="ghost"
          className="w-full justify-start"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Tab
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {tabs.map((tab) => (
            <SidebarMenuItem key={tab.id}>
              <div
                className={`w-full flex items-center justify-between p-2 cursor-pointer ${
                  activeTab === tab.id ? "bg-accent" : ""
                }`}
                onClick={() => onSwitchTab(tab.id)}
              >
                <div className="flex items-center gap-2 truncate">
                  {tab.favicon && (
                    <img
                      src={tab.favicon || "/placeholder.svg"}
                      alt=""
                      className="w-4 h-4"
                    />
                  )}
                  <span className="truncate">
                    {tab.title || new URL(tab.url).hostname}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {/* You can add footer content here if needed */}
      </SidebarFooter>
    </Sidebar>
  );
}
