import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, FrequencyId, Injury } from '../types';
import { FREQUENCIES, INDB, ZONE_ORDER } from '../constants';
import { cn } from '../lib/utils';
import { CheckCircle2, ChevronRight, ChevronLeft, Bolt, Search } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [injSearch, setInjSearch] = useState('');
  const [data, setData] = useState<Partial<UserProfile>>({
    frequency: '012',
    gender: 'male',
    goal: 'cut',
    focus: ['balanced'],
    style: 'block',
    trainDays: ['Mon', 'Tue', 'Thu', 'Fri'],
    injuries: [],
    pinnedWidgets: ['spotify', 'motivation'],
  });

  useEffect(() => {
    document.body.setAttribute('data-frequency', data.frequency || '012');
  }, []);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const update = (key: keyof UserProfile, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const filteredInjuries = useMemo(() => {
    const q = injSearch.toLowerCase().trim();
    if (!q) return INDB;
    return INDB.filter(inj => 
      inj.name.toLowerCase().includes(q) || 
      inj.zone.toLowerCase().includes(q)
    );
  }, [injSearch]);

  const steps = [
    // Step 0: Welcome
    <div key="step0" className="space-y-12 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
          <Bolt className="w-10 h-10 text-accent-primary fill-accent-primary" />
        </div>
      </motion.div>
      
      <div className="space-y-4">
        <h1 className="text-6xl font-bold font-headline tracking-tighter uppercase leading-[0.85]">
          WELCOME TO <br />
          LEAN<span className="text-text-muted/40">IS</span>LAW
        </h1>
        <p className="text-[10px] font-bold tracking-[0.4em] text-text-muted uppercase">
          ASCEND
        </p>
      </div>

      <div className="p-6 bg-card/50 rounded-2xl border border-border-clinical/10 text-left space-y-4">
        <p className="text-xs font-medium text-text-primary/70 leading-relaxed uppercase">
          This system is designed for absolute discipline. We will adapt your training, fuel, and mindset based on clinical data and physical limitations.
        </p>
      </div>
    </div>,

    // Step 1: Identity
    <div key="step1" className="space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Bolt className="w-6 h-6 text-accent-primary fill-accent-primary" />
          <span className="text-2xl font-bold tracking-[-0.05em] text-text-primary font-headline uppercase">
            LEAN<span className="text-text-muted/40">IS</span>LAW
          </span>
        </div>
        <p className="text-[10px] font-bold tracking-[0.3em] text-text-muted uppercase">ASCEND</p>
      </div>
      <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-[0.9]">
        IDENTIFY <br /> YOURSELF
      </h1>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="NAME"
          className="w-full bg-transparent border-b-2 border-text-primary/20 py-4 text-2xl font-headline focus:border-accent-primary outline-none transition-colors uppercase"
          value={data.name || ''}
          onChange={e => update('name', e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          {['male', 'female', 'other'].map(g => (
            <button
              key={g}
              onClick={() => update('gender', g)}
              className={cn(
                "py-3 text-[10px] font-bold tracking-widest uppercase rounded-lg border transition-all",
                data.gender === g ? "bg-text-primary text-background border-text-primary" : "border-text-primary/10 opacity-40"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // Step 2: Stats
    <div key="step2" className="space-y-8">
      <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-[0.9]">
        CLINICAL <br /> METRICS
      </h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Age</label>
          <input
            type="number"
            className="w-full bg-card p-4 rounded-xl border border-border-clinical/10 text-xl font-headline outline-none focus:border-accent-primary transition-colors"
            value={data.age || ''}
            onChange={e => update('age', parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Weight (lbs)</label>
          <input
            type="number"
            className="w-full bg-card p-4 rounded-xl border border-border-clinical/10 text-xl font-headline outline-none focus:border-accent-primary transition-colors"
            value={data.weight || ''}
            onChange={e => update('weight', parseFloat(e.target.value))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Height</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="number"
              placeholder="FT"
              className="w-full bg-card p-4 rounded-xl border border-border-clinical/10 text-xl font-headline outline-none focus:border-accent-primary transition-colors"
              value={Math.floor((data.height || 0) / 12) || ''}
              onChange={e => {
                const ft = parseInt(e.target.value) || 0;
                const inch = (data.height || 0) % 12;
                update('height', ft * 12 + inch);
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-20 uppercase tracking-widest">FT</span>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="IN"
              className="w-full bg-card p-4 rounded-xl border border-border-clinical/10 text-xl font-headline outline-none focus:border-accent-primary transition-colors"
              value={(data.height || 0) % 12 || ''}
              onChange={e => {
                const ft = Math.floor((data.height || 0) / 12);
                const inch = parseInt(e.target.value) || 0;
                update('height', ft * 12 + inch);
              }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-20 uppercase tracking-widest">IN</span>
          </div>
        </div>
      </div>
    </div>,

    // Step 3: Goal
    <div key="step3" className="space-y-8">
      <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-[0.9]">
        SELECT <br /> OBJECTIVE
      </h1>
      <div className="grid grid-cols-1 gap-3">
        {['cut', 'bulk', 'maintain', 'recomp'].map(g => (
          <button
            key={g}
            onClick={() => update('goal', g)}
            className={cn(
              "w-full p-6 text-left rounded-xl border transition-all flex justify-between items-center",
              data.goal === g ? "bg-text-primary text-background border-text-primary" : "bg-card border-border-clinical/10"
            )}
          >
            <span className="text-xl font-headline font-bold uppercase">{g}</span>
            {data.goal === g && <CheckCircle2 className="w-6 h-6" />}
          </button>
        ))}
      </div>
    </div>,

    // Step 4: Style
    <div key="step4" className="space-y-8">
      <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-[0.9]">
        TRAINING <br /> STYLE
      </h1>
      <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-2 clinical-scroll">
        {[
          { id: 'block', name: 'BLOCK TRAINING', desc: 'High-volume, structured blocks (A, B, C).' },
          { id: 'hyrox', name: 'HYROX STYLE', desc: 'Hybrid engine + functional strength endurance.' },
          { id: 'traditional', name: 'TRADITIONAL', desc: 'Classic sets and reps, bodypart split.' },
          { id: 'powerlifting', name: 'POWERLIFTING', desc: 'Focus on the big three: Squat, Bench, Deadlift.' },
          { id: 'metabolic', name: 'METABOLIC', desc: 'High heart rate, circuit-based conditioning.' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => update('style', s.id)}
            className={cn(
              "w-full p-6 text-left rounded-xl border transition-all flex justify-between items-center",
              data.style === s.id ? "bg-text-primary text-background border-text-primary" : "bg-card border-border-clinical/10"
            )}
          >
            <div className="space-y-1">
              <p className="font-headline text-xl font-bold uppercase">{s.name}</p>
              <p className="text-[10px] opacity-60 uppercase tracking-widest leading-tight">{s.desc}</p>
            </div>
            {data.style === s.id && <CheckCircle2 className="w-6 h-6" />}
          </button>
        ))}
      </div>
    </div>,

    // Step 5: Schedule
    <div key="step5" className="space-y-8">
      <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-[0.9]">
        TRAINING <br /> SCHEDULE
      </h1>
      <p className="text-[10px] font-bold tracking-widest opacity-40 uppercase text-left">Select exactly which days you want to train</p>
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => {
          const isSelected = data.trainDays?.includes(d);
          return (
            <button
              key={d}
              onClick={() => {
                const current = data.trainDays || [];
                if (isSelected) {
                  update('trainDays', current.filter(day => day !== d));
                } else {
                  update('trainDays', [...current, d]);
                }
              }}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-lg border transition-all",
                isSelected ? "bg-text-primary text-background border-text-primary" : "bg-card border-border-clinical/10 opacity-40"
              )}
            >
              <span className="text-[10px] font-black">{d[0]}</span>
              <span className="text-[8px] font-bold opacity-60">{d.slice(1)}</span>
            </button>
          );
        })}
      </div>
      <div className="p-4 bg-accent-primary/5 rounded-xl border border-accent-primary/10">
        <p className="text-[10px] font-bold text-accent-primary uppercase tracking-widest">System Note</p>
        <p className="text-[10px] text-text-muted uppercase leading-tight mt-1">The routine generator will strictly map your split to these {data.trainDays?.length || 0} days.</p>
      </div>
    </div>,

    // Step 6: Focus / Lagging Parts
    <div key="step6" className="space-y-8">
      <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-[0.9]">
        PRIORITIZE <br /> GROWTH
      </h1>
      <p className="text-[10px] font-bold tracking-widest opacity-40 uppercase text-left">Select deficient muscles to adapt volume</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'legs', name: 'GROW LEGS' },
          { id: 'chest', name: 'BUILD CHEST' },
          { id: 'back', name: 'WIDEN BACK' },
          { id: 'arms', name: 'ARM PRIORITY' },
          { id: 'shoulders', name: 'CAP SHOULDERS' },
          { id: 'glutes', name: 'GLUTE FOCUS' },
          { id: 'balanced', name: 'BALANCED' },
        ].map(f => {
          const isSelected = data.focus?.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => {
                const current = data.focus || [];
                if (f.id === 'balanced') {
                  update('focus', ['balanced']);
                  return;
                }
                const filtered = current.filter(id => id !== 'balanced');
                if (isSelected) {
                  const next = filtered.filter(id => id !== f.id);
                  update('focus', next.length === 0 ? ['balanced'] : next);
                } else {
                  update('focus', [...filtered, f.id]);
                }
              }}
              className={cn(
                "p-4 text-left rounded-xl border transition-all",
                isSelected ? "bg-text-primary text-background border-text-primary" : "bg-card border-border-clinical/10"
              )}
            >
              <p className="text-xs font-black uppercase tracking-tighter">{f.name}</p>
            </button>
          );
        })}
      </div>
    </div>,

    // Step 7: Intensity
    <div key="step7" className="space-y-8">
      <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-[0.9]">
        SESSION <br /> INTENSITY
      </h1>
      <p className="text-[10px] font-bold tracking-widest opacity-40 uppercase text-left">Select your preferred training volume</p>
      <div className="grid grid-cols-1 gap-3">
        {[
          { id: 'quick', name: 'QUICK', desc: 'Minimalist. -1 round per block. Get in, get out.' },
          { id: 'standard', name: 'STANDARD', desc: 'The clinical baseline. Optimal volume.' },
          { id: 'killer', name: 'KILLER', desc: 'Absolute destruction. +2 rounds per block.' },
        ].map(i => (
          <button
            key={i.id}
            onClick={() => update('intensity', i.id)}
            className={cn(
              "w-full p-6 text-left rounded-xl border transition-all flex justify-between items-center",
              data.intensity === i.id ? "bg-text-primary text-background border-text-primary" : "bg-card border-border-clinical/10"
            )}
          >
            <div className="space-y-1">
              <p className="font-headline text-xl font-bold uppercase">{i.name}</p>
              <p className="text-[10px] opacity-60 uppercase tracking-widest leading-tight">{i.desc}</p>
            </div>
            {data.intensity === i.id && <CheckCircle2 className="w-6 h-6" />}
          </button>
        ))}
      </div>
    </div>,

    // Step 8: Theme
    <div key="step8" className="space-y-8">
      <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-[0.9]">
        SELECT <br /> THEME
      </h1>
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 clinical-scroll">
        {FREQUENCIES.map(f => (
          <button
            key={f.id}
            onClick={() => {
              update('frequency', f.id);
              document.body.setAttribute('data-frequency', f.id);
            }}
            className={cn(
              "w-full p-6 text-left rounded-xl border transition-all flex justify-between items-center",
              data.frequency === f.id ? "bg-text-primary text-background border-text-primary" : "bg-card border-border-clinical/10"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: f.colors.accent }} />
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: f.colors.bg }} />
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: f.colors.card }} />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold tracking-[0.2em] opacity-40 uppercase">FREQUENCY {f.id}</p>
                <p className="font-headline text-xl font-bold uppercase">{f.name}</p>
                <p className="text-[10px] opacity-60 uppercase tracking-widest">{f.vibe}</p>
              </div>
            </div>
            {data.frequency === f.id && <CheckCircle2 className="w-6 h-6" />}
          </button>
        ))}
      </div>
    </div>,

    // Step 9: Injuries
    <div key="step9" className="space-y-8">
      <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-[0.9]">
        PHYSICAL <br /> LIMITS
      </h1>
      <p className="text-[10px] font-bold tracking-widest opacity-40 uppercase text-left">Select any active injuries to adapt your plan</p>
      
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input 
          type="text"
          placeholder="SEARCH INJURIES..."
          className="w-full bg-card p-4 pl-12 rounded-xl border border-border-clinical/10 font-bold uppercase text-xs tracking-widest outline-none focus:border-accent-primary transition-colors"
          value={injSearch}
          onChange={e => setInjSearch(e.target.value)}
        />
      </div>

      <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 clinical-scroll text-left">
        {ZONE_ORDER.map(zone => {
          const zoneInjuries = filteredInjuries.filter(inj => inj.zone === zone);
          if (zoneInjuries.length === 0) return null;

          return (
            <div key={zone} className="space-y-2">
              <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 border-b border-border-clinical/10 pb-1">{zone}</h3>
              <div className="space-y-2">
                {zoneInjuries.map(inj => {
                  const isSelected = data.injuries?.some(i => i.id === inj.id);
                  return (
                    <button
                      key={inj.id}
                      onClick={() => {
                        const current = data.injuries || [];
                        if (isSelected) {
                          update('injuries', current.filter(i => i.id !== inj.id));
                        } else {
                          update('injuries', [...current, inj]);
                        }
                      }}
                      className={cn(
                        "w-full p-4 text-left rounded-xl border transition-all flex justify-between items-center",
                        isSelected ? "bg-text-primary text-background border-text-primary" : "bg-card border-border-clinical/10"
                      )}
                    >
                      <div>
                        <p className="font-bold uppercase text-sm">{inj.name}</p>
                        <p className={cn("text-[9px] font-bold tracking-widest uppercase", isSelected ? "text-background/60" : "opacity-40")}>
                          AVOID: {inj.avoid.slice(0, 2).join(', ')}
                        </p>
                      </div>
                      {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border border-border-clinical/20" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>,
  ];

  const isLastStep = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col justify-center max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-12 flex gap-4">
        {step > 0 && (
          <button
            onClick={back}
            className="p-4 rounded-xl border border-border-clinical/20 text-text-primary"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <button
          onClick={() => {
            if (isLastStep) {
              onComplete(data as UserProfile);
            } else {
              next();
            }
          }}
          disabled={(step === 1 && !data.name) || (step === 2 && (!data.age || !data.weight))}
          className="flex-1 bg-text-primary text-background p-4 rounded-xl font-headline font-bold uppercase tracking-widest flex justify-center items-center gap-2 disabled:opacity-20"
        >
          {isLastStep ? 'INITIALIZE' : 'NEXT'}
          {!isLastStep && <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
