'use client';

import { Map, BarChart2, Navigation } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { icon: Map, label: 'Live Map', path: '/' },
    { icon: BarChart2, label: 'Pattern Analytics', path: '/analytics' },
    { icon: Navigation, label: 'Route Safety', path: '/routes' },
  ];

  return (
    <aside className="w-14 flex flex-col items-center py-5 glass-panel z-40 border-r border-white/10 shrink-0">
      <div className="flex flex-col gap-4">
        {links.map((link) => {
          const isActive = pathname === link.path;
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.path} 
              href={link.path}
              className="relative group"
            >
              <div className={`p-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-white/10 text-cyan-400 font-semibold' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              
              {/* Tooltip */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 rounded bg-gray-900 border border-white/15 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                {link.label}
              </div>
              
              {isActive && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r"
                />
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
