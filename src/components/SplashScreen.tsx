import { motion } from 'motion/react';
import { Bolt } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--t-primary) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center"
      >
        <motion.div
          animate={{ 
            rotate: [0, 0, 180, 180, 0],
            scale: [1, 1.1, 1.1, 1, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-8"
        >
          <Bolt className="w-16 h-16 text-accent-primary fill-accent-primary" />
        </motion.div>

        <div className="overflow-hidden flex">
          {"LEANISLAW".split("").map((letter, i) => (
            <motion.span
              key={i}
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ 
                delay: 0.2 + (i * 0.05), 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className={cn(
                "text-6xl font-headline font-bold tracking-[-0.08em] uppercase leading-none",
                (letter === "I" && "LEANISLAW"[i-1] === "N") || (letter === "S" && "LEANISLAW"[i-1] === "I")
                  ? "text-text-muted/40" 
                  : "text-text-primary"
              )}
            >
              {letter}
            </motion.span>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-4 flex items-center gap-4"
        >
          <div className="h-[1px] w-8 bg-text-primary/20" />
          <p className="text-[10px] font-bold tracking-[0.4em] text-text-muted uppercase">ASCEND</p>
          <div className="h-[1px] w-8 bg-text-primary/20" />
        </motion.div>
      </motion.div>

      {/* Scanning Line Effect */}
      <motion.div 
        initial={{ top: '-10%' }}
        animate={{ top: '110%' }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 w-full h-[2px] bg-accent-primary/20 blur-sm z-10"
      />
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="text-[8px] font-bold tracking-[0.2em] text-text-muted uppercase opacity-40">System Initializing</p>
        <div className="w-48 h-[2px] bg-text-primary/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="h-full bg-accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
