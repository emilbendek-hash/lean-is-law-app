import { UserProfile, FrequencyId, Meal, WeightEntry, WorkoutSession, Injury, Exercise } from '../types';
import { DAYS } from '../App';
import Widget from './Widget';
import { Dumbbell, Utensils, TrendingUp, Brain, Settings, ChevronRight, Plus, X, RefreshCw, Shuffle, Search, Volume2, AlertCircle, Music, Camera, Upload, Bolt, Calculator, User, Star, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useState, useMemo, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCoachResponse, scanFuel } from '../services/geminiService';
import { generateWorkoutPlan, randomizeExercises, generateMixSession } from '../services/workoutService';
import { EXDB, ZONE_ORDER, INDB, FREQUENCIES } from '../constants';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function ComplianceMatrix({ profile }: { profile: UserProfile }) {
  const today = new Date();
  const currentDayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1; // Mon-Sun
  const completedDates = profile.completedDates || [];
  const trainDays = profile.trainDays || [];

  const weekDates = useMemo(() => {
    const dates = [];
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDayIdx);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return dates;
  }, [currentDayIdx]);

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDates.map((dateStr, i) => {
        const isCompleted = completedDates.includes(dateStr);
        const dayName = DAYS[i];
        const isTrainDay = trainDays.includes(dayName);
        const isPast = i < currentDayIdx;
        const isToday = i === currentDayIdx;
        const isFailure = isPast && isTrainDay && !isCompleted;

        return (
          <div key={i} className="space-y-1">
            <div 
              className={cn(
                "aspect-square rounded-sm border flex items-center justify-center transition-all duration-500",
                isCompleted ? "bg-accent-primary border-accent-primary shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.3)]" : 
                isFailure ? "border-red-500/30 bg-red-500/5" : 
                "border-border-clinical/10 bg-card/50"
              )}
            >
              {isFailure && <X className="w-3 h-3 text-red-500/40" />}
              {isToday && !isCompleted && <div className="w-1 h-1 rounded-full bg-accent-primary animate-pulse" />}
            </div>
            <p className="text-[7px] font-black text-center text-text-muted uppercase tracking-tighter">{dayName.slice(0, 3)}</p>
          </div>
        );
      })}
    </div>
  );
}

interface DashboardProps {
  profile: UserProfile;
  meals: Meal[];
  weights: WeightEntry[];
  workoutPlan: WorkoutSession[];
  activeTab: string;
  onUpdateFrequency: (id: FrequencyId) => void;
  onAddMeal: (meal: Meal) => void;
  onDeleteMeal: (id: string) => void;
  onUpdateMeal: (meal: Meal) => void;
  onAddWeight: (weight: WeightEntry) => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onUpdatePlan: (plan: WorkoutSession[]) => void;
}

export default function Dashboard({ 
  profile, 
  meals, 
  weights, 
  workoutPlan,
  activeTab, 
  onUpdateFrequency,
  onAddMeal,
  onDeleteMeal,
  onUpdateMeal,
  onAddWeight,
  onUpdateProfile,
  onUpdatePlan
}: DashboardProps) {
  const renderTab = () => {
    switch (activeTab) {
      case 'train':
        return <TrainTab profile={profile} workoutPlan={workoutPlan} onUpdatePlan={onUpdatePlan} onUpdateProfile={onUpdateProfile} />;
      case 'fuel':
        return <FuelTab profile={profile} meals={meals} onAddMeal={onAddMeal} onDeleteMeal={onDeleteMeal} onUpdateMeal={onUpdateMeal} onUpdateProfile={onUpdateProfile} />;
      case 'data':
        return <DataTab profile={profile} weights={weights} onAddWeight={onAddWeight} />;
      case 'mind':
        return <MindTab profile={profile} onAddMeal={onAddMeal} onUpdateProfile={onUpdateProfile} />;
      case 'mix':
        return <MixTab profile={profile} onUpdatePlan={onUpdatePlan} />;
      case 'more':
        return <MoreTab profile={profile} onUpdateFrequency={onUpdateFrequency} onUpdateProfile={onUpdateProfile} />;
      default:
        return <TrainTab profile={profile} workoutPlan={workoutPlan} onUpdatePlan={onUpdatePlan} onUpdateProfile={onUpdateProfile} />;
    }
  };

  return (
    <div className="space-y-10">
      {activeTab === 'train' && <WelcomeSection profile={profile} meals={meals} />}
      {renderTab()}
    </div>
  );
}

function WelcomeSection({ profile, meals }: { profile: UserProfile, meals: Meal[] }) {
  const [greeting, setGreeting] = useState('');
  const pinned = profile.pinnedWidgets ?? ['spotify', 'motivation'];

  const dailyTotals = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const todayMeals = meals.filter(m => new Date(m.timestamp).toLocaleDateString() === today);
    return todayMeals.reduce((acc, m) => ({
      cal: acc.cal + m.cal,
      pro: acc.pro + m.pro,
      carb: acc.carb + m.carb,
      fat: acc.fat + m.fat,
    }), { cal: 0, pro: 0, carb: 0, fat: 0 });
  }, [meals]);

  const streak = useMemo(() => {
    const completed = profile.completedDates || [];
    if (completed.length === 0) return 0;
    
    let count = 0;
    const today = new Date();
    const todayStr = getTodayDateString();
    let checkDate = new Date(today);
    
    if (!completed.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (completed.includes(dStr)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [profile.completedDates]);

  const weight = profile.weight || 0;
  const height = profile.height || 0;
  const age = profile.age || 0;

  const bmr = profile.gender === 'male' 
    ? (10 * weight * 0.453592) + (6.25 * height * 2.54) - (5 * age) + 5
    : (10 * weight * 0.453592) + (6.25 * height * 2.54) - (5 * age) - 161;
  
  const tdee = Math.round(bmr * 1.55) || 0;
  const targetCal = profile.customMacros?.cal || (profile.goal === 'cut' ? tdee - 500 : profile.goal === 'bulk' ? tdee + 300 : tdee);
  
  const strategy = profile.macroStrategy || 'flexible';
  
  let targetPro = 0;
  let targetCarb = 0;
  let targetFat = 0;

  if (strategy === 'flexible') {
    // FLEXIBLE: User tracks Cals & Protein. Carbs and Fats auto-balance based on remaining energy.
    targetPro = profile.customMacros?.pro || Math.round(weight * 1);
    
    // Prevent protein from requiring more calories than the total target
    if ((targetPro * 4) > targetCal) {
      targetPro = Math.floor((targetCal * 0.8) / 4); // Cap protein at 80% of cals if deficit is extreme
    }

    const remainingCals = Math.max(0, targetCal - (targetPro * 4));
    
    // Split remaining cals evenly between carbs and fats for the baseline target
    targetCarb = profile.customMacros?.carb || Math.round((remainingCals * 0.5) / 4);
    targetFat = profile.customMacros?.fat || Math.round((remainingCals * 0.5) / 9);

  } else if (strategy === 'low-carb') {
    targetPro = Math.round((targetCal * 0.40) / 4);
    targetCarb = Math.round((targetCal * 0.20) / 4);
    targetFat = Math.round((targetCal * 0.40) / 9);
  } else if (strategy === 'high-fat') {
    targetPro = Math.round((targetCal * 0.30) / 4);
    targetCarb = Math.round((targetCal * 0.10) / 4);
    targetFat = Math.round((targetCal * 0.60) / 9);
  } else if (strategy === 'high-protein') {
    targetPro = Math.round((targetCal * 0.45) / 4);
    targetCarb = Math.round((targetCal * 0.30) / 4);
    targetFat = Math.round((targetCal * 0.25) / 9);
  } else {
    // Balanced (30% P, 35% C, 35% F)
    targetPro = Math.round((targetCal * 0.30) / 4);
    targetCarb = Math.round((targetCal * 0.35) / 4);
    targetFat = Math.round((targetCal * 0.35) / 9);
  }

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 18) setGreeting('Good afternoon');
    else if (hour >= 18 && hour < 22) setGreeting('Good evening');
    else setGreeting('Good night');
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <p className="text-[10px] font-bold tracking-[0.3em] text-text-muted uppercase">{greeting}</p>
        <h1 className="text-5xl font-headline font-black tracking-tighter uppercase leading-[0.8]">{profile.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-6 bg-card rounded-[24px] border border-border-clinical/10 space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold tracking-[0.3em] text-text-muted uppercase">Daily Fuel Status</p>
                {streak > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-accent-primary/10 border border-accent-primary/20 rounded-sm">
                    <Bolt className="w-2.5 h-2.5 text-accent-primary" />
                    <span className="text-[8px] font-black text-accent-primary uppercase tracking-tighter">{streak} DAY STREAK</span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-headline font-black tabular-nums">{dailyTotals.cal}</span>
                <span className="text-sm font-bold text-text-muted uppercase">/ {targetCal} KCAL</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[24px] font-headline font-black text-accent-primary tabular-nums">
                {Math.max(0, targetCal - dailyTotals.cal)}
              </p>
              <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Remaining</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border-clinical/5">
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Protein</p>
              <p className="text-sm font-headline font-bold tabular-nums">{dailyTotals.pro}g <span className="text-[10px] opacity-40">/ {targetPro}g</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Carbs</p>
              <p className="text-sm font-headline font-bold tabular-nums">{dailyTotals.carb}g <span className="text-[10px] opacity-40">/ {targetCarb}g</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Fats</p>
              <p className="text-sm font-headline font-bold tabular-nums">{dailyTotals.fat}g <span className="text-[10px] opacity-40">/ {targetFat}g</span></p>
            </div>
          </div>
        </div>

        {pinned.includes('spotify') && (
          <div className="w-full bg-card rounded-[18px] border border-border-clinical/10 overflow-hidden flex items-center justify-center h-[80px] shadow-sm">
            <iframe 
              style={{ borderRadius: '18px', display: 'block', border: 'none' }} 
              src="https://open.spotify.com/embed/playlist/18Ff8d6gOS5K7Ekvgy2g2V?utm_source=generator" 
              width="100%" 
              height="80" 
              allowFullScreen={false} 
              allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
            ></iframe>
          </div>
        )}

        {pinned.includes('motivation') && (
          <div className="flex items-center gap-3 p-3 bg-card rounded-[18px] border border-border-clinical/10">
            <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest truncate">Motivational Note</p>
              <p className="text-xs font-black uppercase truncate">VOICE OF DISCIPLINE</p>
            </div>
            <button 
              onClick={() => {
                const audio = document.getElementById('motivation-audio') as HTMLAudioElement;
                if (audio) {
                  if (audio.paused) audio.play();
                  else audio.pause();
                }
              }}
              className="px-4 py-2 bg-accent-primary text-background text-[10px] font-black rounded-full uppercase tracking-tighter hover:opacity-80 transition-all"
            >
              LISTEN
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TrainTab({ profile, workoutPlan, onUpdatePlan, onUpdateProfile }: { profile: UserProfile, workoutPlan: WorkoutSession[], onUpdatePlan: (p: WorkoutSession[]) => void, onUpdateProfile: (u: Partial<UserProfile>) => void }) {
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [editingExercise, setEditingExercise] = useState<{ sessionId: string, exerciseIdx: number, blockId?: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const todaysSession = workoutPlan.find(s => s.id.toUpperCase() === selectedDay);
  const todayStr = getTodayDateString();
  const isLoggedToday = profile.completedDates?.includes(todayStr);
  const isActive = !!profile.activeSessionStart;

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - profile.activeSessionStart!) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isActive, profile.activeSessionStart]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStartSession = () => {
    onUpdateProfile({ activeSessionStart: Date.now() });
  };

  const handleFinishSession = () => {
    if (!profile.activeSessionStart) return;
    const duration = Math.floor((Date.now() - profile.activeSessionStart) / 1000);
    const currentDates = profile.completedDates || [];
    const currentDurations = profile.sessionDurations || {};
    
    onUpdateProfile({ 
      completedDates: [...currentDates, todayStr],
      sessionDurations: { ...currentDurations, [todayStr]: duration },
      activeSessionStart: undefined
    });
  };

  const handleRegenerate = () => {
    const newPlan = generateWorkoutPlan(profile);
    onUpdatePlan(newPlan);
  };

  const handleRandomize = () => {
    const newPlan = randomizeExercises(workoutPlan);
    onUpdatePlan(newPlan);
  };

  const handleUpdateExercise = (sessionId: string, idx: number, updates: Partial<Exercise>, blockId?: string) => {
    const newPlan = workoutPlan.map(session => {
      if (session.id === sessionId) {
        if (blockId && session.blocks) {
          const newBlocks = session.blocks.map(block => {
            if (block.id === blockId) {
              const newExercises = [...block.exercises];
              newExercises[idx] = { ...newExercises[idx], ...updates };
              return { ...block, exercises: newExercises };
            }
            return block;
          });
          return { ...session, blocks: newBlocks };
        } else {
          const newExercises = [...session.exercises];
          newExercises[idx] = { ...newExercises[idx], ...updates };
          return { ...session, exercises: newExercises };
        }
      }
      return session;
    });
    onUpdatePlan(newPlan);
    setEditingExercise(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase">TRAIN</h2>
        <div className="flex gap-2">
          <button onClick={handleRandomize} className="p-2 bg-card border border-border-clinical/10 rounded-lg text-text-muted hover:text-text-primary transition-colors">
            <Shuffle className="w-4 h-4" />
          </button>
          <button onClick={handleRegenerate} className="p-2 bg-card border border-border-clinical/10 rounded-lg text-text-muted hover:text-text-primary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ComplianceMatrix profile={profile} />

      <div className="flex justify-between items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={cn(
              "flex-1 min-w-[45px] py-3 rounded-xl text-[10px] font-black transition-all border",
              selectedDay === day 
                ? "bg-text-primary text-background border-text-primary shadow-lg shadow-text-primary/20" 
                : "bg-card text-text-muted border-border-clinical/10 hover:border-border-clinical/30"
            )}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {todaysSession ? (
          <div className="space-y-4">
            <div className="p-4 bg-card rounded-[24px] border border-accent-primary shadow-xl shadow-accent-primary/5 space-y-6">
              <div className="flex items-center gap-4 border-b border-border-clinical/5 pb-4">
                <div className={cn(
                  "w-12 h-12 rounded-[14px] flex items-center justify-center",
                  todaysSession.isRest ? "bg-text-muted/10" : "bg-accent-primary/10"
                )}>
                  <Dumbbell className={cn("w-6 h-6", todaysSession.isRest ? "text-text-muted" : "text-accent-primary")} />
                </div>
                <div>
                  <h3 className="text-lg font-headline font-black uppercase tracking-tight">{todaysSession.name}</h3>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{todaysSession.type}</p>
                </div>
              </div>

              <div className="space-y-6">
                {todaysSession.isRest ? (
                  <div className="py-12 text-center space-y-4">
                    <p className="text-[10px] font-black tracking-[0.4em] text-text-muted uppercase">Rest. Recover. Come back stronger.</p>
                    <div className="inline-block px-4 py-2 bg-accent-primary/5 border border-accent-primary/10 rounded-full">
                      <p className="text-[10px] font-bold text-accent-primary uppercase">Active Recovery: 15min Stretching</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {isActive && (
                      <div className="flex items-center justify-center gap-4 p-6 bg-accent-primary/5 rounded-2xl border border-accent-primary/20 animate-pulse">
                        <Timer className="w-8 h-8 text-accent-primary" />
                        <div className="text-center">
                          <p className="text-[10px] font-black text-accent-primary uppercase tracking-[0.3em]">Session Active</p>
                          <p className="text-4xl font-headline font-black tabular-nums">{formatTime(elapsed)}</p>
                        </div>
                      </div>
                    )}

                    {todaysSession.warmup && (
                      <div className="p-4 bg-accent-primary/5 rounded-2xl border border-accent-primary/10 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
                          <Bolt className="w-4 h-4 text-accent-primary" />
                        </div>
                        <p className="text-xs font-bold text-text-muted uppercase leading-relaxed">{todaysSession.warmup}</p>
                      </div>
                    )}

                    {todaysSession.blocks ? (
                      <div className="space-y-10">
                        {todaysSession.blocks.map((block) => (
                          <div key={block.id} className="space-y-4">
                            <div className="flex justify-between items-center border-b-2 border-accent-primary/30 pb-2">
                              <div className="flex items-center gap-3">
                                <div className="bg-accent-primary text-background text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-md">
                                  {block.id}
                                </div>
                                <h4 className="text-xs font-black tracking-widest text-text-primary uppercase">
                                  {block.name}
                                </h4>
                              </div>
                              <span className="text-[10px] font-black text-accent-primary uppercase tracking-tighter bg-accent-primary/10 px-2 py-0.5 rounded-sm">
                                {block.rounds} ROUNDS
                              </span>
                            </div>
                            <div className="space-y-2 pl-9">
                              {block.exercises.map((ex, idx) => (
                                <div key={idx} className="group flex items-center justify-between p-4 bg-background/40 rounded-2xl border border-border-clinical/5 hover:border-accent-primary/30 transition-all">
                                  <span className="text-xs font-bold uppercase tracking-tight text-text-primary/90">{ex.name}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-text-muted uppercase tabular-nums">{ex.reps}</span>
                                    <button 
                                      onClick={() => setEditingExercise({ sessionId: todaysSession.id, exerciseIdx: idx, blockId: block.id })}
                                      className="p-1 text-accent-primary hover:bg-accent-primary/10 rounded transition-all"
                                    >
                                      <Settings className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : todaysSession.isCardio ? (
                      <div className="p-6 bg-accent-primary/5 rounded-2xl border border-accent-primary/10 space-y-2">
                        <p className="text-[10px] font-black text-accent-primary uppercase tracking-widest">Cardio Session</p>
                        <p className="text-sm font-bold text-text-muted uppercase leading-relaxed">30-45 min incline treadmill 12-15% / 3.0 mph</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {todaysSession.exercises.map((ex, idx) => (
                          <div key={idx} className="group flex items-center justify-between p-4 bg-background rounded-2xl border border-border-clinical/5 hover:border-accent-primary/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                              <span className="text-xs font-bold uppercase tracking-tight">{ex.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-text-muted uppercase tabular-nums">{ex.sets} × {ex.reps}</span>
                              <button 
                                onClick={() => setEditingExercise({ sessionId: todaysSession.id, exerciseIdx: idx })}
                                className="p-1 text-accent-primary hover:bg-accent-primary/10 rounded transition-all"
                              >
                                <Settings className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {todaysSession.cardio && (
                      <div className="p-4 bg-accent-primary/5 rounded-2xl border border-accent-primary/10">
                        <p className="text-[10px] font-black text-accent-primary uppercase tracking-widest mb-1">Cardio Finisher</p>
                        <p className="text-xs font-bold text-text-muted uppercase leading-relaxed">{todaysSession.cardio}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button 
                onClick={isActive ? handleFinishSession : handleStartSession}
                disabled={isLoggedToday}
                className={cn(
                  "w-full py-6 border-4 font-headline font-black text-xl uppercase tracking-widest transition-all",
                  isLoggedToday 
                    ? "bg-card border-border-clinical/10 text-text-muted opacity-50 cursor-not-allowed" 
                    : isActive
                      ? "bg-red-500 border-text-primary text-white hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_rgba(239,68,68,0.3)]"
                      : "bg-accent-primary border-text-primary text-background hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_rgba(var(--accent-primary-rgb),0.3)]"
                )}
              >
                {isLoggedToday ? "SESSION LOGGED" : isActive ? "FINISH SESSION" : "START SESSION"}
              </button>
              
              {isLoggedToday && profile.sessionDurations?.[todayStr] && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Timer className="w-3 h-3 text-text-muted" />
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Duration: {formatTime(profile.sessionDurations[todayStr])}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 bg-card rounded-[24px] border border-border-clinical/10 text-center space-y-4">
            <div className="w-16 h-16 bg-text-muted/10 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-text-muted" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-headline font-black uppercase">REST DAY</h3>
              <p className="text-[10px] font-black tracking-[0.4em] text-text-muted uppercase">Active Recovery: 15min Stretching</p>
            </div>
          </div>
        )}
      </div>

      <Widget title="Active Injury Adaptation" variant="low">
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.injuries && profile.injuries.length > 0 ? (
            profile.injuries.map((inj) => (
              <span key={inj.id} className="px-2 py-1 bg-text-primary text-background text-[9px] font-bold rounded-sm uppercase">
                {inj.name} PROTECTION
              </span>
            ))
          ) : (
            <span className="px-2 py-1 bg-background text-text-primary text-[9px] font-bold rounded-sm uppercase border border-border-clinical/20">
              No Active Injuries
            </span>
          )}
        </div>
        <p className="text-[10px] text-text-muted font-medium uppercase leading-relaxed">
          Your plan is automatically adapted to avoid high-risk movements for your specific injuries.
        </p>
      </Widget>

      <AnimatePresence>
        {editingExercise && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-card rounded-[24px] border border-border-clinical/20 p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-headline font-bold uppercase">Edit Exercise</h3>
                <button onClick={() => setEditingExercise(null)}><X className="w-6 h-6" /></button>
              </div>
              
              {(() => {
                const session = workoutPlan.find(s => s.id === editingExercise.sessionId);
                const ex = editingExercise.blockId 
                  ? session?.blocks?.find(b => b.id === editingExercise.blockId)?.exercises[editingExercise.exerciseIdx]
                  : session?.exercises[editingExercise.exerciseIdx];
                
                if (!ex) return null;

                return (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleUpdateExercise(editingExercise.sessionId, editingExercise.exerciseIdx, {
                      name: formData.get('name') as string,
                      sets: parseInt(formData.get('sets') as string),
                      reps: formData.get('reps') as string,
                    }, editingExercise.blockId);
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Exercise Name</label>
                      <input name="name" defaultValue={ex.name} className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Sets</label>
                        <input name="sets" type="number" defaultValue={ex.sets} className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Reps</label>
                        <input name="reps" defaultValue={ex.reps} className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm" required />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-text-primary text-background p-4 rounded-xl font-headline font-bold uppercase tracking-widest">UPDATE EXERCISE</button>
                  </form>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FuelTab({ profile, meals, onAddMeal, onDeleteMeal, onUpdateMeal, onUpdateProfile }: { profile: UserProfile, meals: Meal[], onAddMeal: (meal: Meal) => void, onDeleteMeal: (id: string) => void, onUpdateMeal: (meal: Meal) => void, onUpdateProfile: (p: Partial<UserProfile>) => void }) {
  const [isLogging, setIsLogging] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [mealToDelete, setMealToDelete] = useState<string | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [proposedMeal, setProposedMeal] = useState<Omit<Meal, 'id' | 'timestamp'> | null>(null);
  const [isFavoriteProposed, setIsFavoriteProposed] = useState(false);

  const handleAISubmit = async () => {
    if (!aiInput.trim() || isAIProcessing) return;
    setIsAIProcessing(true);
    setProposedMeal(null);

    try {
      const result = await scanFuel(aiInput);
      setProposedMeal({
        name: result.name.toUpperCase(),
        cal: result.calories,
        pro: result.protein,
        carb: result.carbs,
        fat: result.fat,
        description: aiInput
      });
    } catch (error) {
      console.error('AI Fuel Scanner Error:', error);
    } finally {
      setIsAIProcessing(false);
    }
  };
  
  const dailyTotals = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const todayMeals = meals.filter(m => new Date(m.timestamp).toLocaleDateString() === today);
    return todayMeals.reduce((acc, m) => ({
      cal: acc.cal + m.cal,
      pro: acc.pro + m.pro,
      carb: acc.carb + m.carb,
      fat: acc.fat + m.fat,
    }), { cal: 0, pro: 0, carb: 0, fat: 0 });
  }, [meals]);

  // TDEE Calculation (Simplified Mifflin-St Jeor)
  const weight = profile.weight || 0;
  const height = profile.height || 0;
  const age = profile.age || 0;

  const bmr = profile.gender === 'male' 
    ? (10 * weight * 0.453592) + (6.25 * height * 2.54) - (5 * age) + 5
    : (10 * weight * 0.453592) + (6.25 * height * 2.54) - (5 * age) - 161;
  
  const tdee = Math.round(bmr * 1.55) || 0;
  const targetCal = profile.customMacros?.cal || (profile.goal === 'cut' ? tdee - 500 : profile.goal === 'bulk' ? tdee + 300 : tdee);
  
  const strategy = profile.macroStrategy || 'flexible';
  
  let targetPro = 0;
  let targetCarb = 0;
  let targetFat = 0;

  if (strategy === 'flexible') {
    // FLEXIBLE: User tracks Cals & Protein. Carbs and Fats auto-balance based on remaining energy.
    targetPro = profile.customMacros?.pro || Math.round(weight * 1);
    
    // Prevent protein from requiring more calories than the total target
    if ((targetPro * 4) > targetCal) {
      targetPro = Math.floor((targetCal * 0.8) / 4); // Cap protein at 80% of cals if deficit is extreme
    }

    const remainingCals = Math.max(0, targetCal - (targetPro * 4));
    
    // Split remaining cals evenly between carbs and fats for the baseline target
    targetCarb = profile.customMacros?.carb || Math.round((remainingCals * 0.5) / 4);
    targetFat = profile.customMacros?.fat || Math.round((remainingCals * 0.5) / 9);

  } else if (strategy === 'low-carb') {
    targetPro = Math.round((targetCal * 0.40) / 4);
    targetCarb = Math.round((targetCal * 0.20) / 4);
    targetFat = Math.round((targetCal * 0.40) / 9);
  } else if (strategy === 'high-fat') {
    targetPro = Math.round((targetCal * 0.30) / 4);
    targetCarb = Math.round((targetCal * 0.10) / 4);
    targetFat = Math.round((targetCal * 0.60) / 9);
  } else if (strategy === 'high-protein') {
    targetPro = Math.round((targetCal * 0.45) / 4);
    targetCarb = Math.round((targetCal * 0.30) / 4);
    targetFat = Math.round((targetCal * 0.25) / 9);
  } else {
    // Balanced (30% P, 35% C, 35% F)
    targetPro = Math.round((targetCal * 0.30) / 4);
    targetCarb = Math.round((targetCal * 0.35) / 4);
    targetFat = Math.round((targetCal * 0.35) / 9);
  }

  const remaining = (targetCal - dailyTotals.cal) || 0;

  const [isEditingMacros, setIsEditingMacros] = useState(false);
  const [editCal, setEditCal] = useState(targetCal);
  const [editPro, setEditPro] = useState(targetPro);
  const [editFat, setEditFat] = useState(targetFat);
  const [editCarb, setEditCarb] = useState(targetCarb);

  const syncMacros = (field: 'cal' | 'pro' | 'fat' | 'carb', val: number) => {
    const value = Math.max(0, val);
    
    if (field === 'cal') {
      const currentTotal = (editPro * 4) + (editCarb * 4) + (editFat * 9) || 1;
      const ratio = value / currentTotal;
      setEditCal(value);
      setEditPro(Math.round(editPro * ratio));
      setEditCarb(Math.round(editCarb * ratio));
      setEditFat(Math.round(editFat * ratio));
    } else if (field === 'pro') {
      const remaining = Math.max(0, editCal - (value * 4));
      const otherTotal = (editCarb * 4) + (editFat * 9) || 1;
      const carbRatio = (editCarb * 4) / otherTotal;
      setEditPro(value);
      setEditCarb(Math.round((remaining * carbRatio) / 4));
      setEditFat(Math.round((remaining * (1 - carbRatio)) / 9));
    } else if (field === 'carb') {
      const remaining = Math.max(0, editCal - (value * 4));
      const otherTotal = (editPro * 4) + (editFat * 9) || 1;
      const proRatio = (editPro * 4) / otherTotal;
      setEditCarb(value);
      setEditPro(Math.round((remaining * proRatio) / 4));
      setEditFat(Math.round((remaining * (1 - proRatio)) / 9));
    } else if (field === 'fat') {
      const remaining = Math.max(0, editCal - (value * 9));
      const otherTotal = (editPro * 4) + (editCarb * 4) || 1;
      const proRatio = (editPro * 4) / otherTotal;
      setEditFat(value);
      setEditPro(Math.round((remaining * proRatio) / 4));
      setEditCarb(Math.round((remaining * (1 - proRatio)) / 4));
    }
  };

  const [isCalculatingTDEE, setIsCalculatingTDEE] = useState(false);
  const [activityLevel, setActivityLevel] = useState(1.55);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase">FUEL</h2>
        <button 
          onClick={() => setIsLogging(true)}
          className="text-[10px] font-bold tracking-widest uppercase underline underline-offset-4"
        >
          LOG MEAL
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Widget title="Daily Expenditure" className="bg-accent-primary/5 border-accent-primary/10">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-5xl font-headline font-bold tabular-nums",
              remaining < 0 ? "text-accent-primary" : "text-text-primary"
            )}>{remaining}</span>
            <span className="text-sm font-bold text-text-muted uppercase">{remaining < 0 ? 'OVER LIMIT' : 'CAL REMAINING'}</span>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div className="h-1 bg-text-primary/10 flex-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-primary transition-all duration-500" 
                style={{ width: `${Math.min(100, (dailyTotals.cal / targetCal) * 100)}%` }}
              />
            </div>
            <span className="ml-4 text-[10px] font-bold tabular-nums">
              {Math.round((dailyTotals.cal / targetCal) * 100)}%
            </span>
          </div>
        </Widget>

        <div className="grid grid-cols-3 gap-2">
          <Widget title="PRO" className="p-4">
            <p className="text-xl font-headline font-bold tabular-nums">{dailyTotals.pro}g</p>
            <p className="text-[8px] mt-1 font-bold text-text-muted uppercase">OF {targetPro}g</p>
          </Widget>
          <Widget title="CARB" className="p-4">
            <p className="text-xl font-headline font-bold tabular-nums">{dailyTotals.carb}g</p>
            <p className="text-[8px] mt-1 font-bold text-text-muted uppercase">OF {targetCarb}g</p>
          </Widget>
          <Widget title="FAT" className="p-4">
            <p className="text-xl font-headline font-bold tabular-nums">{dailyTotals.fat}g</p>
            <p className="text-[8px] mt-1 font-bold text-text-muted uppercase">OF {targetFat}g</p>
          </Widget>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={() => {
            setEditCal(targetCal);
            setEditPro(targetPro);
            setEditFat(targetFat);
            setEditCarb(targetCarb);
            setIsEditingMacros(true);
          }}
          className="p-4 bg-card border border-border-clinical/10 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-accent-primary/30 transition-all"
        >
          <Settings className="w-4 h-4 text-text-muted group-hover:text-accent-primary" />
          <span className="text-[8px] font-black uppercase tracking-widest">Edit Goals</span>
        </button>
        <button 
          onClick={() => setIsCalculatingTDEE(true)}
          className="p-4 bg-card border border-border-clinical/10 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-accent-primary/30 transition-all"
        >
          <Calculator className="w-4 h-4 text-text-muted group-hover:text-accent-primary" />
          <span className="text-[8px] font-black uppercase tracking-widest">TDEE Calc</span>
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold tracking-widest uppercase opacity-40">AI FUEL SCANNER</p>
        <div className="bg-card border border-border-clinical/10 rounded-xl p-4 space-y-4">
          <div className="flex gap-2">
            <input 
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAISubmit()}
              placeholder="DESCRIBE YOUR MEAL..." 
              className="flex-1 bg-background px-4 py-2 rounded-lg outline-none font-bold uppercase text-[10px] tracking-widest border border-border-clinical/5 focus:border-accent-primary transition-all"
            />
            <button 
              onClick={handleAISubmit}
              disabled={!aiInput.trim() || isAIProcessing}
              className="bg-text-primary text-background p-2 rounded-lg disabled:opacity-20 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {isAIProcessing && (
            <div className="flex items-center gap-2 text-accent-primary animate-pulse">
              <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce delay-75" />
              <div className="w-1 h-1 bg-accent-primary rounded-full animate-bounce delay-150" />
              <span className="text-[8px] font-black uppercase tracking-widest">Analyzing fuel composition...</span>
            </div>
          )}

          {proposedMeal && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-xl space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[8px] font-bold text-accent-primary uppercase tracking-widest">Proposed Entry</p>
                  <button 
                    onClick={() => setIsFavoriteProposed(!isFavoriteProposed)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full border transition-all",
                      isFavoriteProposed ? "bg-accent-primary text-background border-accent-primary" : "border-accent-primary/20 text-accent-primary"
                    )}
                  >
                    <Star className={cn("w-3 h-3", isFavoriteProposed && "fill-current")} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Favorite</span>
                  </button>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Meal Content / Quantity</label>
                  <textarea 
                    value={proposedMeal.description || ''}
                    onChange={e => setProposedMeal({ ...proposedMeal, description: e.target.value })}
                    placeholder="E.G. 200G RICE, 150G CHICKEN..."
                    className="w-full bg-background/50 px-3 py-2 rounded-lg outline-none font-bold uppercase text-[10px] border border-border-clinical/5 focus:border-accent-primary transition-all min-h-[60px] resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Meal Name</label>
                  <input 
                    value={proposedMeal.name}
                    onChange={e => setProposedMeal({ ...proposedMeal, name: e.target.value.toUpperCase() })}
                    className="w-full bg-background/50 px-3 py-2 rounded-lg outline-none font-black uppercase text-xs border border-border-clinical/5 focus:border-accent-primary transition-all"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 bg-background/50 rounded-lg border border-border-clinical/5">
                  <p className="text-[8px] font-bold text-text-muted uppercase">KCAL</p>
                  <p className="text-xs font-black">{proposedMeal.cal}</p>
                </div>
                <div className="text-center p-2 bg-background/50 rounded-lg border border-border-clinical/5">
                  <p className="text-[8px] font-bold text-text-muted uppercase">PRO</p>
                  <p className="text-xs font-black">{proposedMeal.pro}g</p>
                </div>
                <div className="text-center p-2 bg-background/50 rounded-lg border border-border-clinical/5">
                  <p className="text-[8px] font-bold text-text-muted uppercase">CARB</p>
                  <p className="text-xs font-black">{proposedMeal.carb}g</p>
                </div>
                <div className="text-center p-2 bg-background/50 rounded-lg border border-border-clinical/5">
                  <p className="text-[8px] font-bold text-text-muted uppercase">FAT</p>
                  <p className="text-xs font-black">{proposedMeal.fat}g</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    setProposedMeal(null);
                    setIsFavoriteProposed(false);
                  }}
                  className="p-2 border border-border-clinical/10 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-background transition-all"
                >
                  DISCARD
                </button>
                <button 
                  onClick={() => {
                    const mealData = { ...proposedMeal, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), isFavorite: isFavoriteProposed };
                    onAddMeal(mealData);
                    
                    if (isFavoriteProposed) {
                      const currentFavorites = profile.favoriteMeals || [];
                      // Avoid duplicates by name
                      if (!currentFavorites.some(f => f.name === mealData.name)) {
                        onUpdateProfile({ favoriteMeals: [...currentFavorites, mealData] });
                      }
                    }
                    
                    setProposedMeal(null);
                    setIsFavoriteProposed(false);
                    setAiInput('');
                  }}
                  className="p-2 bg-accent-primary text-background rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-accent-primary/20 hover:opacity-90 transition-all"
                >
                  APPROVE & LOG
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold tracking-widest uppercase opacity-40">FAVORITE MEALS</p>
        <div className="flex gap-2 overflow-x-auto pb-2 clinical-scroll">
          {(!profile.favoriteMeals || profile.favoriteMeals.length === 0) ? (
            <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest p-4 border border-dashed border-border-clinical/10 rounded-xl w-full text-center">
              No favorites saved yet
            </p>
          ) : (
            profile.favoriteMeals.map((fav) => (
              <button
                key={fav.id}
                onClick={() => onAddMeal({ ...fav, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() })}
                className="flex-shrink-0 p-3 bg-card border border-border-clinical/10 rounded-xl hover:border-accent-primary/30 transition-all text-left min-w-[120px]"
              >
                <p className="text-[10px] font-black uppercase truncate">{fav.name}</p>
                <p className="text-[8px] font-bold text-accent-primary uppercase">{fav.cal} KCAL</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold tracking-widest uppercase opacity-40">MACRO STRATEGY</p>
        <div className="grid grid-cols-3 gap-2">
          {(['flexible', 'balanced', 'low-carb', 'high-fat', 'high-protein'] as const).map((s) => (
            <button
              key={s}
              onClick={() => onUpdateProfile({ macroStrategy: s })}
              className={cn(
                "p-3 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all",
                (profile.macroStrategy || 'flexible') === s 
                  ? "bg-text-primary text-background border-text-primary" 
                  : "bg-card border-border-clinical/10 text-text-muted hover:border-accent-primary/30"
              )}
            >
              {s.replace('-', ' ')}
            </button>
          ))}
        </div>
        {(profile.macroStrategy || 'flexible') === 'flexible' && (
          <p className="text-[8px] font-bold text-accent-primary uppercase tracking-widest opacity-60">
            FLEXIBLE MODE: Hit your Calories and Protein. Carbs and Fats will auto-balance to fill the remainder.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-40">TODAY'S LOG</p>
          <span className="text-[10px] font-bold text-text-muted uppercase">
            {meals.filter(m => new Date(m.timestamp).toLocaleDateString() === new Date().toLocaleDateString()).length} ENTRIES
          </span>
        </div>
        
        <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 clinical-scroll">
          {meals.filter(m => new Date(m.timestamp).toLocaleDateString() === new Date().toLocaleDateString()).length === 0 ? (
            <div className="p-8 border border-dashed border-border-clinical/10 rounded-xl text-center">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">No fuel logged today</p>
            </div>
          ) : (
            meals.filter(m => new Date(m.timestamp).toLocaleDateString() === new Date().toLocaleDateString())
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border-clinical/10 hover:border-accent-primary/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-primary/5 flex items-center justify-center text-accent-primary">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight group-hover:text-accent-primary transition-colors">{meal.name}</p>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                        {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-headline font-bold tabular-nums">{meal.cal} KCAL</p>
                      <p className="text-[8px] text-text-muted font-bold uppercase tracking-tighter">
                        P:{meal.pro} C:{meal.carb} F:{meal.fat}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingMeal(meal)}
                        className="p-1 hover:bg-background rounded-md text-text-muted hover:text-accent-primary transition-colors"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => setMealToDelete(meal.id)}
                        className="p-1 hover:bg-background rounded-md text-text-muted hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        <button 
          onClick={() => setIsLogging(true)}
          className="w-full p-4 bg-accent-primary/5 border border-dashed border-accent-primary/20 rounded-xl flex items-center justify-center gap-2 text-accent-primary hover:bg-accent-primary/10 transition-all group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Quick Entry</span>
        </button>
      </div>

      <AnimatePresence>
        {isEditingMacros && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-card rounded-[32px] border border-border-clinical/20 p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-headline font-bold uppercase">Manual Macros</h3>
                <button onClick={() => setIsEditingMacros(false)}><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                onUpdateProfile({ customMacros: { cal: editCal, pro: editPro, fat: editFat, carb: editCarb } });
                setIsEditingMacros(false);
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Total Calories</label>
                  <input 
                    type="number" 
                    value={editCal}
                    onChange={(e) => syncMacros('cal', parseInt(e.target.value) || 0)}
                    className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm focus:border-accent-primary transition-colors" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Pro (g)</label>
                    <input 
                      type="number" 
                      value={editPro}
                      onChange={(e) => syncMacros('pro', parseInt(e.target.value) || 0)}
                      className="w-full bg-background p-3 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-xs focus:border-accent-primary transition-colors" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Carb (g)</label>
                    <input 
                      type="number" 
                      value={editCarb}
                      onChange={(e) => syncMacros('carb', parseInt(e.target.value) || 0)}
                      className="w-full bg-background p-3 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-xs focus:border-accent-primary transition-colors" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Fat (g)</label>
                    <input 
                      type="number" 
                      value={editFat}
                      onChange={(e) => syncMacros('fat', parseInt(e.target.value) || 0)}
                      className="w-full bg-background p-3 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-xs focus:border-accent-primary transition-colors" 
                      required 
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-text-primary text-background p-4 rounded-xl font-headline font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                  SAVE BALANCED MACROS
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isCalculatingTDEE && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-card rounded-[32px] border border-border-clinical/20 p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-headline font-bold uppercase">TDEE CALCULATOR</h3>
                <button onClick={() => setIsCalculatingTDEE(false)}><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Activity Level</p>
                  <div className="space-y-2">
                    {[
                      { val: 1.2, name: 'Sedentary', desc: 'Office job, little exercise' },
                      { val: 1.375, name: 'Light', desc: '1-3 days/week exercise' },
                      { val: 1.55, name: 'Moderate', desc: '3-5 days/week exercise' },
                      { val: 1.725, name: 'Heavy', desc: '6-7 days/week exercise' },
                      { val: 1.9, name: 'Athlete', desc: 'Physical job + 2x/day training' },
                    ].map(lvl => (
                      <button
                        key={lvl.val}
                        onClick={() => setActivityLevel(lvl.val)}
                        className={cn(
                          "w-full p-4 text-left rounded-xl border transition-all",
                          activityLevel === lvl.val ? "bg-accent-primary/10 border-accent-primary" : "bg-background border-border-clinical/10"
                        )}
                      >
                        <p className="text-xs font-bold uppercase">{lvl.name}</p>
                        <p className="text-[8px] opacity-60 uppercase tracking-widest">{lvl.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-accent-primary/5 rounded-xl border border-accent-primary/10 text-center">
                  <p className="text-[10px] font-bold text-accent-primary uppercase tracking-widest">Calculated TDEE</p>
                  <p className="text-3xl font-headline font-black">{Math.round(bmr * activityLevel)} KCAL</p>
                </div>
                <button 
                  onClick={() => {
                    const newTdee = Math.round(bmr * activityLevel);
                    const newCal = profile.goal === 'cut' ? newTdee - 500 : profile.goal === 'bulk' ? newTdee + 300 : newTdee;
                    const newPro = Math.round(weight * 1);
                    const newFat = Math.round((newCal * 0.25) / 9);
                    const newCarb = Math.round((newCal - (newPro * 4) - (newFat * 9)) / 4);
                    onUpdateProfile({ 
                      customMacros: { cal: newCal, pro: newPro, fat: newFat, carb: newCarb } 
                    });
                    setIsCalculatingTDEE(false);
                  }}
                  className="w-full bg-text-primary text-background p-4 rounded-xl font-headline font-bold uppercase tracking-widest"
                >
                  APPLY TO SYSTEM
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {mealToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-card rounded-[32px] border border-border-clinical/20 p-8 space-y-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-bold uppercase">Delete Entry?</h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-relaxed">
                  This action will permanently remove this fuel record from your system.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setMealToDelete(null)}
                  className="p-4 rounded-xl border border-border-clinical/10 text-[10px] font-bold uppercase tracking-widest hover:bg-background transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => {
                    onDeleteMeal(mealToDelete);
                    setMealToDelete(null);
                    setEditingMeal(null);
                  }}
                  className="p-4 rounded-xl bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20"
                >
                  CONFIRM
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {editingMeal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-card rounded-[32px] border border-border-clinical/20 p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-xl font-headline font-bold uppercase">Edit Entry</h3>
                  <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Modify fuel parameters</p>
                </div>
                <button onClick={() => setEditingMeal(null)} className="p-2 hover:bg-background rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                onUpdateMeal({
                  ...editingMeal,
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  cal: parseInt(formData.get('cal') as string) || 0,
                  pro: parseInt(formData.get('pro') as string) || 0,
                  carb: parseInt(formData.get('carb') as string) || 0,
                  fat: parseInt(formData.get('fat') as string) || 0,
                });
                setEditingMeal(null);
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Meal Content / Quantity</label>
                  <div className="relative">
                    <textarea 
                      name="description" 
                      defaultValue={editingMeal.description} 
                      className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-xs focus:border-accent-primary transition-colors min-h-[80px] resize-none pr-12" 
                      placeholder="E.G. 200G RICE, 150G CHICKEN..."
                    />
                    <button 
                      type="button"
                      onClick={async (e) => {
                        const textarea = (e.currentTarget.previousSibling as HTMLTextAreaElement);
                        const val = textarea.value;
                        if (!val.trim() || isAIProcessing) return;
                        
                        setIsAIProcessing(true);
                        try {
                          const response = await getCoachResponse(
                            `Calculate the nutritional content for this meal: "${val}". Respond ONLY by calling the log_meal function with accurate estimates.`,
                            [],
                            `User context: ${profile.goal}`
                          );
                          const calls = response.functionCalls;
                          if (calls && calls.length > 0) {
                            const call = calls.find(c => c.name === 'log_meal');
                            if (call) {
                              const args = call.args as any;
                              // Update the form fields manually since we are in a form
                              const form = textarea.form;
                              if (form) {
                                (form.elements.namedItem('cal') as HTMLInputElement).value = args.cal.toString();
                                (form.elements.namedItem('pro') as HTMLInputElement).value = args.pro.toString();
                                (form.elements.namedItem('carb') as HTMLInputElement).value = args.carb.toString();
                                (form.elements.namedItem('fat') as HTMLInputElement).value = args.fat.toString();
                                (form.elements.namedItem('name') as HTMLInputElement).value = args.name.toUpperCase();
                              }
                            }
                          }
                        } catch (err) {
                          console.error('Re-scan error:', err);
                        } finally {
                          setIsAIProcessing(false);
                        }
                      }}
                      className="absolute right-2 top-2 p-2 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-all disabled:opacity-50"
                      disabled={isAIProcessing}
                    >
                      {isAIProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Meal Identity</label>
                  <input name="name" defaultValue={editingMeal.name} className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm focus:border-accent-primary transition-colors" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Energy (Kcal)</label>
                    <input name="cal" type="number" defaultValue={editingMeal.cal} className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm focus:border-accent-primary transition-colors" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Protein (g)</label>
                    <input name="pro" type="number" defaultValue={editingMeal.pro} className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm focus:border-accent-primary transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Carbs (g)</label>
                    <input name="carb" type="number" defaultValue={editingMeal.carb} className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm focus:border-accent-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Fats (g)</label>
                    <input name="fat" type="number" defaultValue={editingMeal.fat} className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm focus:border-accent-primary transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setMealToDelete(editingMeal.id)}
                    className="w-full p-4 rounded-xl border border-red-500/20 text-red-500 font-headline font-bold uppercase tracking-widest hover:bg-red-500/5 transition-colors"
                  >
                    DELETE
                  </button>
                  <button type="submit" className="w-full bg-text-primary text-background p-4 rounded-xl font-headline font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-text-primary/10">
                    UPDATE
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isLogging && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-card rounded-[32px] border border-border-clinical/20 p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-xl font-headline font-bold uppercase">Quick Entry</h3>
                  <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Log your fuel with clinical precision</p>
                </div>
                <button onClick={() => setIsLogging(false)} className="p-2 hover:bg-background rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                onAddMeal({
                  id: Math.random().toString(36).substr(2, 9),
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  cal: parseInt(formData.get('cal') as string) || 0,
                  pro: parseInt(formData.get('pro') as string) || 0,
                  carb: parseInt(formData.get('carb') as string) || 0,
                  fat: parseInt(formData.get('fat') as string) || 0,
                  timestamp: Date.now(),
                });
                setIsLogging(false);
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Meal Content / Quantity</label>
                  <textarea 
                    name="description" 
                    placeholder="E.G. 200G RICE, 150G CHICKEN..." 
                    className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-xs focus:border-accent-primary transition-colors min-h-[80px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Meal Identity</label>
                  <input name="name" placeholder="E.G. POST-WORKOUT SHAKE" className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm focus:border-accent-primary transition-colors" required autoFocus />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Energy (Kcal)</label>
                    <input name="cal" type="number" placeholder="0" className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm focus:border-accent-primary transition-colors" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Protein (g)</label>
                    <input name="pro" type="number" placeholder="0" className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm focus:border-accent-primary transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Carbs (g)</label>
                    <input name="carb" type="number" placeholder="0" className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm focus:border-accent-primary transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Fats (g)</label>
                    <input name="fat" type="number" placeholder="0" className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm focus:border-accent-primary transition-colors" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-text-primary text-background p-4 rounded-xl font-headline font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-text-primary/10">
                  COMMIT TO LOG
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DataTab({ profile, weights, onAddWeight }: { profile: UserProfile, weights: WeightEntry[], onAddWeight: (w: WeightEntry) => void }) {
  const [isLogging, setIsLogging] = useState(false);
  
  const chartData = useMemo(() => {
    return weights.slice(-7).map(w => ({
      date: new Date(w.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      weight: w.weight
    }));
  }, [weights]);

  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : (profile.weight || 0);
  const startWeight = profile.weight || 0;
  const totalShed = Math.max(0, startWeight - currentWeight) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase">DATA</h2>
        <button 
          onClick={() => setIsLogging(true)}
          className="text-[10px] font-bold tracking-widest uppercase underline underline-offset-4"
        >
          LOG WEIGHT
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Widget title="CURRENT WEIGHT">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-headline font-bold tabular-nums">{currentWeight}</span>
            <span className="text-xs font-bold text-text-muted uppercase">LBS</span>
          </div>
        </Widget>
        <Widget title="TOTAL SHED">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-headline font-bold tabular-nums text-accent-primary">{totalShed.toFixed(1)}</span>
            <span className="text-xs font-bold text-text-muted uppercase">LBS</span>
          </div>
        </Widget>
      </div>
      
      <Widget title="Weight Trend (Last 7 Entries)" className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fontWeight: 700, fill: "var(--t-muted)" }} 
            />
            <YAxis 
              hide 
              domain={['dataMin - 2', 'dataMax + 2']} 
            />
            <Tooltip 
              contentStyle={{ background: "var(--card)", border: "1px solid var(--bd)", borderRadius: "12px", fontSize: "10px", fontWeight: 700 }}
              labelStyle={{ display: "none" }}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="var(--accent-1)" 
              strokeWidth={3} 
              dot={{ r: 4, fill: "var(--accent-1)", strokeWidth: 0 }} 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Widget>

      <AnimatePresence>
        {isLogging && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-md bg-card rounded-[24px] border border-border-clinical/20 p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-headline font-bold uppercase">Log Weight</h3>
                <button onClick={() => setIsLogging(false)}><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                onAddWeight({
                  date: new Date().toLocaleDateString(),
                  weight: parseFloat(formData.get('weight') as string) || 0,
                  timestamp: Date.now(),
                });
                setIsLogging(false);
              }} className="space-y-4">
                <input name="weight" type="number" step="0.1" placeholder="WEIGHT (LBS)" className="w-full bg-background p-4 rounded-xl outline-none border border-border-clinical/10 font-bold uppercase text-sm" required autoFocus />
                <button type="submit" className="w-full bg-text-primary text-background p-4 rounded-xl font-headline font-bold uppercase tracking-widest">SAVE WEIGHT</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MindTab({ profile, onAddMeal, onUpdateProfile }: { profile: UserProfile, onAddMeal: (m: Meal) => void, onUpdateProfile: (p: Partial<UserProfile>) => void }) {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const activeInjuries = (profile.injuries || []).filter(i => i.status === 'active' || i.status === 'recovering');
      const userContext = `User profile: ${profile.name}, ${profile.gender}, ${profile.age}y, ${profile.weight}lbs. Goal: ${profile.goal}. Focus: ${profile.focus.join(', ')}. Train Days: ${profile.trainDays.join(', ')}. Active Injuries: ${activeInjuries.map(i => `${i.name} (${i.status})`).join(', ')}.`;
      const response = await getCoachResponse(input, messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })), userContext);

      const calls = response.functionCalls;
      if (calls && calls.length > 0) {
        for (const call of calls) {
          if (call.name === 'log_meal') {
            const args = call.args as any;
            onAddMeal({
              id: Math.random().toString(36).substr(2, 9),
              name: args.name,
              cal: args.cal,
              pro: args.pro,
              carb: args.carb,
              fat: args.fat,
              timestamp: Date.now()
            });
            setMessages(prev => [...prev, { role: 'assistant', content: `Understood. Logged ${args.name} (${args.cal} kcal). Discipline maintained.` }]);
          } else if (call.name === 'update_profile') {
            onUpdateProfile(call.args as any);
            setMessages(prev => [...prev, { role: 'assistant', content: `Profile updated. System adapted to new parameters.` }]);
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: response.text || "No response from system." }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "System error. Re-initializing connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-[calc(100vh-200px)] flex flex-col"
    >
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 clinical-scroll">
        {messages.length === 0 && (
          <>
            <Widget title="COACH EMIL" className="bg-accent-primary/5 border-accent-primary/20">
              <p className="text-sm leading-relaxed text-text-primary/80">
                System ready. I am your high-performance coach. Tell me what you ate, update your injuries, or ask for a plan adaptation. I am here to ensure absolute discipline.
              </p>
            </Widget>
          </>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed",
            msg.role === 'user' 
              ? "bg-text-primary text-background ml-auto rounded-tr-none" 
              : "bg-card border border-border-clinical/10 mr-auto rounded-tl-none"
          )}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="bg-card border border-border-clinical/10 mr-auto rounded-2xl rounded-tl-none p-4 max-w-[85%] animate-pulse">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-text-muted rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-text-muted rounded-full animate-bounce delay-75" />
                <div className="w-1 h-1 bg-text-muted rounded-full animate-bounce delay-150" />
              </div>
              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">THINKING...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 bg-card p-2 rounded-2xl border border-border-clinical/10">
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="COMMAND COACH EMIL..." 
          className="flex-1 bg-transparent px-4 py-2 outline-none font-bold uppercase text-xs tracking-widest"
        />
        <button 
          onClick={handleSend}
          className="bg-text-primary text-background p-3 rounded-xl"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function MixTab({ profile, onUpdatePlan }: { profile: UserProfile, onUpdatePlan: (p: WorkoutSession[]) => void }) {
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [style, setStyle] = useState(profile.style);

  const handleGenerate = () => {
    const session = generateMixSession(style, selectedMuscles, profile.injuries, profile.intensity || 'standard');
    onUpdatePlan([session]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase">MIX</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">SELECT MUSCLES</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(EXDB).map(m => (
              <button
                key={m}
                onClick={() => {
                  if (selectedMuscles.includes(m)) {
                    setSelectedMuscles(selectedMuscles.filter(x => x !== m));
                  } else {
                    setSelectedMuscles([...selectedMuscles, m]);
                  }
                }}
                className={cn(
                  "px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all",
                  selectedMuscles.includes(m) ? "bg-accent-primary text-background border-accent-primary" : "bg-card border-border-clinical/10 text-text-muted"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">ROUTINE STYLE</p>
          <div className="grid grid-cols-2 gap-2">
            {['block', 'traditional', 'powerlifting', 'metabolic', 'hyrox'].map(s => (
              <button
                key={s}
                onClick={() => setStyle(s as any)}
                className={cn(
                  "p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                  style === s ? "bg-text-primary text-background border-text-primary" : "bg-card border-border-clinical/10 text-text-muted"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={selectedMuscles.length === 0}
          className="w-full bg-text-primary text-background p-4 rounded-xl font-headline font-bold uppercase tracking-widest disabled:opacity-20"
        >
          GENERATE SESSION
        </button>
      </div>
    </motion.div>
  );
}

function MoreTab({ profile, onUpdateFrequency, onUpdateProfile }: { profile: UserProfile, onUpdateFrequency: (id: FrequencyId) => void, onUpdateProfile: (p: Partial<UserProfile>) => void }) {
  const pinned = profile.pinnedWidgets ?? ['spotify', 'motivation'];
  const [isCropping, setIsCropping] = useState(false);
  const [tempImg, setTempImg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const togglePin = (widget: string) => {
    const newPinned = pinned.includes(widget) 
      ? pinned.filter(w => w !== widget)
      : [...pinned, widget];
    onUpdateProfile({ pinnedWidgets: newPinned });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempImg(event.target?.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      onUpdateProfile({ pic: base64 });
      setIsCropping(false);
      setTempImg(null);
    }
  };

  useEffect(() => {
    if (isCropping && tempImg && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          canvas.width = 400;
          canvas.height = 400;
          ctx.drawImage(img, x, y, size, size, 0, 0, 400, 400);
        }
      };
      img.src = tempImg;
    }
  }, [isCropping, tempImg]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase">MORE</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">IDENTIFICATION</p>
          <div className="p-6 bg-card border border-border-clinical/10 rounded-[24px] flex items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-background border border-border-clinical/20 flex items-center justify-center overflow-hidden">
                {profile.pic ? (
                  <img src={profile.pic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-text-muted" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"
              >
                <Upload className="w-5 h-5 text-text-primary" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-headline font-bold uppercase tracking-tight">{profile.name}</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">System User ID: {profile.name.toLowerCase().replace(/\s+/g, '_')}</p>
              {profile.pic && (
                <button 
                  onClick={() => onUpdateProfile({ pic: undefined })}
                  className="text-[8px] font-bold text-accent-primary uppercase tracking-widest hover:underline"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">ACCOUNT</p>
          <div className="p-6 bg-card border border-border-clinical/10 rounded-[24px] space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase">GUEST_USER_01</p>
                <p className="text-[8px] text-text-muted uppercase tracking-widest">Local Storage Session</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-border-clinical/5">
              <div className="space-y-2">
                <label className="text-[8px] font-bold tracking-widest opacity-40 uppercase ml-2">Email Address</label>
                <input type="email" placeholder="EMAIL@DOMAIN.COM" className="w-full bg-background p-4 rounded-xl border border-border-clinical/10 font-bold uppercase text-xs outline-none focus:border-accent-primary transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-bold tracking-widest opacity-40 uppercase ml-2">Username</label>
                <input type="text" placeholder="CHOSEN_IDENTITY" className="w-full bg-background p-4 rounded-xl border border-border-clinical/10 font-bold uppercase text-xs outline-none focus:border-accent-primary transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-bold tracking-widest opacity-40 uppercase ml-2">Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-background p-4 rounded-xl border border-border-clinical/10 font-bold uppercase text-xs outline-none focus:border-accent-primary transition-colors" />
              </div>
              <button className="w-full p-4 bg-text-primary text-background rounded-xl font-headline font-bold uppercase tracking-widest text-xs shadow-lg shadow-text-primary/10">
                INITIALIZE CLOUD SYNC
              </button>
            </div>
            <p className="text-[8px] text-center text-text-muted uppercase tracking-tighter">Sync your discipline across all devices</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">PERSONAL METRICS</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-bold tracking-widest opacity-40 uppercase ml-2">Age</label>
              <input 
                type="number" 
                defaultValue={profile.age}
                onChange={(e) => onUpdateProfile({ age: parseInt(e.target.value) })}
                className="w-full bg-card p-4 rounded-xl border border-border-clinical/10 font-headline font-bold text-sm outline-none focus:border-accent-primary transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold tracking-widest opacity-40 uppercase ml-2">Weight (lbs)</label>
              <input 
                type="number" 
                defaultValue={profile.weight}
                onChange={(e) => onUpdateProfile({ weight: parseFloat(e.target.value) })}
                className="w-full bg-card p-4 rounded-xl border border-border-clinical/10 font-headline font-bold text-sm outline-none focus:border-accent-primary transition-colors"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[8px] font-bold tracking-widest opacity-40 uppercase ml-2">Height</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="FT"
                    defaultValue={Math.floor((profile.height || 0) / 12)}
                    onChange={(e) => {
                      const ft = parseInt(e.target.value) || 0;
                      const inch = (profile.height || 0) % 12;
                      onUpdateProfile({ height: ft * 12 + inch });
                    }}
                    className="w-full bg-card p-4 rounded-xl border border-border-clinical/10 font-headline font-bold text-sm outline-none focus:border-accent-primary transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-20 uppercase tracking-widest">FT</span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="IN"
                    defaultValue={(profile.height || 0) % 12}
                    onChange={(e) => {
                      const ft = Math.floor((profile.height || 0) / 12);
                      const inch = parseInt(e.target.value) || 0;
                      onUpdateProfile({ height: ft * 12 + inch });
                    }}
                    className="w-full bg-card p-4 rounded-xl border border-border-clinical/10 font-headline font-bold text-sm outline-none focus:border-accent-primary transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-20 uppercase tracking-widest">IN</span>
                </div>
              </div>
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[8px] font-bold tracking-widest opacity-40 uppercase ml-2">DOB</label>
              <input 
                type="date" 
                defaultValue={profile.dob}
                onChange={(e) => onUpdateProfile({ dob: e.target.value })}
                className="w-full bg-card p-4 rounded-xl border border-border-clinical/10 font-headline font-bold text-[10px] outline-none focus:border-accent-primary transition-colors uppercase"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">DASHBOARD CUSTOMIZATION</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'spotify', name: 'Spotify Playlist', icon: Music },
              { id: 'motivation', name: 'Motivational Note', icon: Volume2 },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => togglePin(w.id)}
                className={cn(
                  "w-full p-4 rounded-xl border flex items-center justify-between transition-all",
                  pinned.includes(w.id) 
                    ? "bg-accent-primary/10 border-accent-primary text-text-primary" 
                    : "bg-card border-border-clinical/10 text-text-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <w.icon className={cn("w-5 h-5", pinned.includes(w.id) ? "text-accent-primary" : "text-text-muted")} />
                  <span className="text-sm font-bold uppercase tracking-tight">{w.name}</span>
                </div>
                <div className={cn(
                  "w-10 h-5 rounded-full relative transition-colors",
                  pinned.includes(w.id) ? "bg-accent-primary" : "bg-text-muted/20"
                )}>
                  <div className={cn(
                    "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                    pinned.includes(w.id) ? "right-1" : "left-1"
                  )} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">TRAINING PREFERENCE</p>
          <div className="grid grid-cols-2 gap-2">
            {['block', 'traditional', 'powerlifting', 'metabolic', 'hyrox'].map((s) => (
              <button
                key={s}
                onClick={() => onUpdateProfile({ style: s as any })}
                className={cn(
                  "p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                  profile.style === s 
                    ? "bg-text-primary text-background border-text-primary" 
                    : "bg-card border-border-clinical/10 text-text-muted hover:border-accent-primary/30"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">SESSION INTENSITY</p>
          <div className="grid grid-cols-3 gap-2">
            {(['quick', 'standard', 'killer'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onUpdateProfile({ intensity: lvl })}
                className={cn(
                  "p-4 rounded-xl border font-headline font-black uppercase transition-all",
                  profile.intensity === lvl 
                    ? "bg-accent-primary text-background border-accent-primary" 
                    : "bg-card text-text-muted border-border-clinical/10 hover:border-accent-primary/30"
                )}
              >
                <p className="text-xs">{lvl}</p>
                <p className="text-[8px] opacity-60 font-bold tracking-tighter">
                  {lvl === 'quick' ? '-1 ROUND' : lvl === 'killer' ? '+2 ROUNDS' : 'NORMAL'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">FREQUENCY SHIFT (THEME)</p>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCIES.map((f) => (
              <button
                key={f.id}
                onClick={() => onUpdateFrequency(f.id as FrequencyId)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all flex items-center gap-3",
                  profile.frequency === f.id 
                    ? "bg-text-primary text-background border-text-primary" 
                    : "bg-card border-border-clinical/10 text-text-muted hover:border-accent-primary/30"
                )}
              >
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.colors.accent }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.colors.bg }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.colors.card }} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-tight">{f.name}</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">{f.vibe}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-card border border-border-clinical/10 rounded-xl group-open:rounded-b-none transition-all">
              <p className="text-[10px] font-bold tracking-[0.3em] text-text-muted uppercase">Clinical Injury Database</p>
              <ChevronRight className="w-4 h-4 text-text-muted transition-transform group-open:rotate-90" />
            </summary>
            <div className="p-4 bg-card/50 border-x border-b border-border-clinical/10 rounded-b-xl space-y-6">
              {(profile.injuries || []).length > 0 && (
                <div className="space-y-2 mb-6">
                  <p className="text-[8px] font-bold tracking-[0.2em] uppercase opacity-40">Active Status</p>
                  <div className="grid grid-cols-1 gap-2">
                    {profile.injuries.map(inj => (
                      <div key={inj.id} className="p-4 bg-card border border-border-clinical/10 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase">{inj.name}</p>
                          <p className="text-[8px] text-text-muted uppercase tracking-widest">{inj.status || 'active'}</p>
                        </div>
                        <div className="flex gap-1">
                          {(['active', 'recovering', 'cleared'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => {
                                const newInjuries = profile.injuries.map(i => 
                                  i.id === inj.id ? { ...i, status: s } : i
                                );
                                onUpdateProfile({ injuries: newInjuries });
                              }}
                              className={cn(
                                "px-2 py-1 text-[8px] font-bold uppercase rounded-sm border transition-all",
                                inj.status === s || (!inj.status && s === 'active')
                                  ? "bg-accent-primary text-background border-accent-primary"
                                  : "bg-background text-text-muted border-border-clinical/10"
                              )}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ZONE_ORDER.map(zone => {
                const zoneInjuries = INDB.filter(inj => inj.zone === zone);
                return (
                  <div key={zone} className="space-y-2">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 border-b border-border-clinical/10 pb-1">{zone}</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {zoneInjuries.map(inj => (
                        <div key={inj.id} className="p-4 bg-card border border-border-clinical/10 rounded-xl space-y-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-accent-primary" />
                            <span className="text-sm font-bold uppercase">{inj.name}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-[8px] font-bold text-accent-primary uppercase tracking-widest">Avoid</p>
                              <p className="text-[10px] text-text-muted uppercase leading-tight">{inj.avoid.join(', ')}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest">Safe</p>
                              <p className="text-[10px] text-text-muted uppercase leading-tight">{inj.safe.join(', ')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">SYSTEM</p>
          <button 
            onClick={() => {
              localStorage.removeItem('lil_profile');
              localStorage.removeItem('lil_meals');
              localStorage.removeItem('lil_weights');
              localStorage.removeItem('lil_plan');
              window.location.reload();
            }}
            className="w-full p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-xl flex items-center justify-center text-accent-primary text-[10px] font-bold uppercase tracking-widest"
          >
            RESET DISCIPLINE
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isCropping && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-background/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-card rounded-[32px] border border-border-clinical/20 p-8 space-y-8 shadow-2xl"
            >
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-headline font-bold uppercase tracking-tight">CROP IDENTITY</h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Adjust frame for clinical accuracy</p>
              </div>

              <div className="aspect-square w-full bg-background rounded-full overflow-hidden border-4 border-accent-primary/20 shadow-inner">
                <canvas ref={canvasRef} className="w-full h-full object-cover" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setIsCropping(false);
                    setTempImg(null);
                  }}
                  className="p-4 rounded-xl border border-border-clinical/10 text-[10px] font-bold uppercase tracking-widest hover:bg-card transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleCrop}
                  className="p-4 rounded-xl bg-text-primary text-background text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-text-primary/10"
                >
                  CONFIRM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

