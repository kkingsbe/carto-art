'use client';

import { Compass, Sliders, Type, Layout, Film, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export type Tab = 'essentials' | 'customize' | 'annotate' | 'frame' | 'animate' | 'library' | 'account';

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
          "flex flex-col items-center justify-center py-3 px-2.5 space-y-0.5 transition-all duration-200 mx-1.5 rounded-xl min-w-[52px] min-h-[56px]",
          isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/5"
        )}>
          <Icon className={cn("w-6 h-6", isActive && "text-white")} />
          <span className={cn(
            "text-[10px] font-medium leading-tight",
            isActive ? "text-white/90" : "text-gray-400 dark:text-gray-500"
          )}>
            {label}
          </span>
        </div>
      </button>
    );
  };

  return (
    <nav className="flex-none w-20 border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center py-4 bg-transparent transition-all duration-300">
      <div className="hidden md:flex items-center justify-center w-full mb-6">
        <Link href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
          <span className="font-bold text-white text-lg">C</span>
        </Link>
      </div>

      <div className="flex flex-col w-full space-y-3">
        {/* Core Workflow */}
        <TabButton id="essentials" icon={Compass} label="Start" />
        <TabButton id="customize" icon={Sliders} label="Edit" />
        <TabButton id="annotate" icon={Type} label="Annotations" />
        <TabButton id="frame" icon={Layout} label="Frame" />
        <TabButton id="animate" icon={Film} label="Animate" />

        {/* Resources - Visually separated */}
        <div className="w-8 h-px bg-gray-200 dark:bg-gray-700 my-2 mx-auto" />

        <TabButton id="library" icon={Sparkles} label="Library" />
      </div>

      <div className="mt-auto flex flex-col w-full space-y-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <TabButton id="account" icon={User} label="Account" />
      </div>
    </nav>
  );
}


