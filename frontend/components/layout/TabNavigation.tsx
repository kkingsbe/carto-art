'use client';

import { Map as MapIcon, Type, Layout, Sparkles, Palette, User, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export type Tab = 'library' | 'location' | 'style' | 'layers' | 'text' | 'frame' | 'account';

interface TabNavigationProps {
  activeTab: Tab;
  isDrawerOpen: boolean;
  onTabChange: (tab: Tab) => void;
  onToggleDrawer: (open: boolean) => void;
}

export function TabNavigation({
  activeTab,
  isDrawerOpen,
  onTabChange,
  onToggleDrawer
}: TabNavigationProps) {

  const handleTabClick = (id: Tab) => {
    if (activeTab === id && isDrawerOpen) {
      onToggleDrawer(false);
    } else {
      onTabChange(id);
      onToggleDrawer(true);
    }
  };

  const TabButton = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => {
    const isActive = activeTab === id && isDrawerOpen;
    return (
      <button
        onClick={() => handleTabClick(id)}
        className="w-full relative group"
        title={label}
      >
        <div className={cn(
          "flex flex-col items-center justify-center py-4 px-2 space-y-1.5 transition-all duration-200 mx-2 rounded-xl",
          isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/5"
        )}>
          <Icon className={cn("w-6 h-6", isActive && "text-white")} />
          <span className={cn("text-[10px] font-medium transition-opacity duration-200", isActive ? "text-white/90" : "opacity-0 group-hover:opacity-100 hidden md:block")}>
            {label}
          </span>
        </div>
      </button>
    );
  };

  return (
    <nav className="flex-none w-16 md:w-20 border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center py-4 bg-transparent">
      <div className="hidden md:flex items-center justify-center w-full mb-6">
        <Link href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
          <span className="font-bold text-white text-lg">C</span>
        </Link>
      </div>

      <div className="flex flex-col w-full space-y-2">
        <TabButton id="library" icon={Sparkles} label="Library" />
        <TabButton id="location" icon={MapIcon} label="Location" />
        <TabButton id="style" icon={Palette} label="Style" />
        <TabButton id="layers" icon={Layers} label="Layers" />
        <TabButton id="text" icon={Type} label="Text" />
        <TabButton id="frame" icon={Layout} label="Frame" />
      </div>

      <div className="mt-auto flex flex-col w-full space-y-2 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <TabButton id="account" icon={User} label="Account" />
      </div>
    </nav>
  );
}

