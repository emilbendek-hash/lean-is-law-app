import { Dumbbell, Utensils, BarChart3, Brain, LayoutGrid, Shuffle } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'train', label: 'TRAIN', icon: Dumbbell },
  { id: 'fuel', label: 'FUEL', icon: Utensils },
  { id: 'data', label: 'DATA', icon: BarChart3 },
  { id: 'mind', label: 'MIND', icon: Brain },
  { id: 'mix', label: 'MIX', icon: Shuffle },
  { id: 'more', label: 'MORE', icon: LayoutGrid },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-3 bg-background/80 backdrop-blur-xl rounded-t-[20px] shadow-[0_-20px_40px_rgba(0,0,0,0.05)] border-t border-border-clinical/10">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-200",
              isActive ? "text-accent-primary scale-110" : "text-text-muted hover:text-text-primary"
            )}
          >
            <Icon className={cn("w-6 h-6", isActive && "fill-accent-primary/20")} />
            <span className="text-[9px] font-bold tracking-widest uppercase mt-1.5 font-sans">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
