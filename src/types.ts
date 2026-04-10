export type FrequencyId = '011' | '012' | '013' | '014' | '015' | '016';

export interface Frequency {
  id: FrequencyId;
  name: string;
  description: string;
  vibe: string;
  colors: {
    bg: string;
    card: string;
    accent: string;
  };
}

export interface Injury {
  id: string;
  name: string;
  zone: string;
  avoid: string[];
  safe: string[];
  status?: 'active' | 'recovering' | 'cleared';
}

export interface UserProfile {
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  weight: number;
  height: number;
  goal: 'cut' | 'bulk' | 'maintain' | 'recomp';
  focus: string[];
  style: 'block' | 'traditional' | 'powerlifting' | 'metabolic' | 'hyrox';
  trainDays: string[];
  frequency: FrequencyId;
  injuries: Injury[];
  pinnedWidgets?: string[];
  pic?: string;
  intensity?: 'quick' | 'standard' | 'killer';
  dob?: string;
  customMacros?: MacroGoals;
  macroStrategy?: 'flexible' | 'balanced' | 'low-carb' | 'high-fat' | 'high-protein';
  favoriteMeals?: Meal[];
  completedDates?: string[];
  sessionDurations?: Record<string, number>;
  activeSessionStart?: number;
}

export interface MacroGoals {
  cal: number;
  pro: number;
  carb: number;
  fat: number;
}

export interface Meal {
  id: string;
  name: string;
  cal: number;
  pro: number;
  carb: number;
  fat: number;
  timestamp: number;
  isFavorite?: boolean;
  description?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  type: string;
  volume: number;
  exercises: Exercise[];
  blocks?: WorkoutBlock[];
  warmup?: string;
  cardio?: string;
  isRest?: boolean;
  isCardio?: boolean;
}

export interface WorkoutBlock {
  id: string;
  name: string;
  rounds: number;
  exercises: Exercise[];
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
}

export interface WeightEntry {
  date: string;
  weight: number;
  timestamp: number;
}

export interface DailyMacros {
  date: string;
  consumed: MacroGoals;
  meals: Meal[];
}
