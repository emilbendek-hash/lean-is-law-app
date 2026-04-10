/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { UserProfile, FrequencyId, Meal, WeightEntry, WorkoutSession } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import { motion, AnimatePresence } from 'motion/react';
import { generateWorkoutPlan } from './services/workoutService';

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('train');

  useEffect(() => {
    const savedProfile = localStorage.getItem('lil_profile');
    const savedMeals = localStorage.getItem('lil_meals');
    const savedWeights = localStorage.getItem('lil_weights');
    const savedPlan = localStorage.getItem('lil_plan');

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        document.body.setAttribute('data-frequency', parsed.frequency || '012');
      } catch (e) {
        console.error('Failed to parse profile', e);
      }
    }
    if (savedMeals) setMeals(JSON.parse(savedMeals));
    if (savedWeights) setWeights(JSON.parse(savedWeights));
    if (savedPlan) setWorkoutPlan(JSON.parse(savedPlan));
    
    setIsLoaded(true);

    // Hide splash after 2.5s
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (profile?.frequency) {
      document.body.setAttribute('data-frequency', profile.frequency);
    }
  }, [profile?.frequency]);

  const handleCompleteOnboarding = (newProfile: UserProfile) => {
    setProfile(newProfile);
    const plan = generateWorkoutPlan(newProfile);
    setWorkoutPlan(plan);
    localStorage.setItem('lil_profile', JSON.stringify(newProfile));
    localStorage.setItem('lil_plan', JSON.stringify(plan));
    document.body.setAttribute('data-frequency', newProfile.frequency);
  };

  const handleUpdateFrequency = (freqId: FrequencyId) => {
    if (profile) {
      const updated = { ...profile, frequency: freqId };
      setProfile(updated);
      localStorage.setItem('lil_profile', JSON.stringify(updated));
      document.body.setAttribute('data-frequency', freqId);
    }
  };

  const handleAddMeal = (meal: Meal) => {
    const updated = [...meals, meal];
    setMeals(updated);
    localStorage.setItem('lil_meals', JSON.stringify(updated));
  };

  const handleDeleteMeal = (mealId: string) => {
    const updated = meals.filter(m => m.id !== mealId);
    setMeals(updated);
    localStorage.setItem('lil_meals', JSON.stringify(updated));
  };

  const handleUpdateMeal = (updatedMeal: Meal) => {
    const updated = meals.map(m => m.id === updatedMeal.id ? updatedMeal : m);
    setMeals(updated);
    localStorage.setItem('lil_meals', JSON.stringify(updated));
  };

  const handleAddWeight = (weight: WeightEntry) => {
    const updated = [...weights, weight];
    setWeights(updated);
    localStorage.setItem('lil_weights', JSON.stringify(updated));
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    if (profile) {
      const updated = { ...profile, ...updates };
      setProfile(updated);
      localStorage.setItem('lil_profile', JSON.stringify(updated));
      
      // If goal, style, focus, injuries, or intensity changed, regenerate plan
      if (updates.goal || updates.style || updates.focus || updates.injuries || updates.intensity) {
        const newPlan = generateWorkoutPlan(updated);
        setWorkoutPlan(newPlan);
        localStorage.setItem('lil_plan', JSON.stringify(newPlan));
      }
    }
  };

  const handleUpdatePlan = (newPlan: WorkoutSession[]) => {
    setWorkoutPlan(newPlan);
    localStorage.setItem('lil_plan', JSON.stringify(newPlan));
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" />
        ) : !profile ? (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <Onboarding onComplete={handleCompleteOnboarding} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <Header profile={profile} />
            <main className="flex-1 pt-20 pb-24 px-6 max-w-md mx-auto w-full">
              <Dashboard 
                profile={profile} 
                meals={meals}
                weights={weights}
                workoutPlan={workoutPlan}
                activeTab={activeTab} 
                onUpdateFrequency={handleUpdateFrequency}
                onAddMeal={handleAddMeal}
                onDeleteMeal={handleDeleteMeal}
                onUpdateMeal={handleUpdateMeal}
                onAddWeight={handleAddWeight}
                onUpdateProfile={handleUpdateProfile}
                onUpdatePlan={handleUpdatePlan}
              />
            </main>
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
