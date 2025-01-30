"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AddressBarProps {
  url: string;
  onNavigate: (url: string) => void;
}

export default function AddressBar({ url, onNavigate }: AddressBarProps) {
  const [inputValue, setInputValue] = useState(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue) {
      const fullUrl = inputValue.startsWith("http")
        ? inputValue
        : `https://${inputValue}`;
      onNavigate(fullUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 bg-background border-b">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search or enter URL"
          className="w-full pl-9 pr-4"
        />
      </div>
    </form>
  );
}
