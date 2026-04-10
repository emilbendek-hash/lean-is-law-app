import { UserProfile, WorkoutSession, Exercise, Injury } from '../types';
import { EXDB, INDB } from '../constants';

const DAYNAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function generateMixSession(style: string, muscles: string[], injuries: Injury[], intensity: string): WorkoutSession {
  const isActive = (inj: Injury) => inj.status === 'active' || inj.status === 'recovering';
  const shInj = injuries.some(i => i.zone === 'shoulder' && isActive(i));
  const knInj = injuries.some(i => i.zone === 'knee' && isActive(i));

  const getPool = (m: string) => {
    const pool = EXDB[m] || [];
    return pool.filter(ex => {
      const isAvoided = injuries.some(inj => isActive(inj) && inj.avoid.some(a => ex.n.toLowerCase().includes(a.toLowerCase())));
      return !isAvoided;
    });
  };

  const allPool: Exercise[] = muscles.flatMap(m => getPool(m).map(ex => ({ name: ex.n, sets: 1, reps: '10 reps' })));
  const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);
  const pool = shuffle(allPool);

  const session: WorkoutSession = {
    id: 'mix-' + Date.now(),
    name: 'CUSTOM MIX',
    type: style.toUpperCase(),
    volume: 0,
    exercises: [],
    warmup: '5-10 min dynamic mobility'
  };

  if (style === 'block') {
    session.blocks = [
      { id: 'A', name: 'Primary Compound', rounds: getRounds(4, intensity), exercises: pool.slice(0, 3).map(e => ({ ...e, sets: 1, reps: '8-10 reps' })) },
      { id: 'B', name: 'Secondary Compound', rounds: getRounds(4, intensity), exercises: pool.slice(3, 5).map(e => ({ ...e, sets: 1, reps: '10-12 reps' })) },
      { id: 'C', name: 'Isolation/Volume', rounds: getRounds(3, intensity), exercises: pool.slice(5, 8).map(e => ({ ...e, sets: 1, reps: '12-15 reps' })) },
      { id: 'D', name: 'Burnout', rounds: getRounds(3, intensity), exercises: pool.slice(8, 11).map(e => ({ ...e, sets: 1, reps: '15-20 reps' })) }
    ];
    session.cardio = '15 min steady state';
  } else if (style === 'traditional') {
    session.exercises = [
      ...pool.slice(0, 2).map(e => ({ ...e, sets: 4, reps: '8-10 reps' })),
      ...pool.slice(2, 5).map(e => ({ ...e, sets: 4, reps: '10-12 reps' })),
      ...pool.slice(5, 8).map(e => ({ ...e, sets: 3, reps: '15 reps' }))
    ];
  } else if (style === 'hyrox') {
    session.blocks = [
      { id: 'A', name: 'Engine Base', rounds: 1, exercises: [{ name: '1000m Row or SkiErg', sets: 1, reps: 'Hard Effort' }] },
      { id: 'B', name: 'Compromised Running', rounds: getRounds(4, intensity), exercises: [{ name: '400m Run', sets: 1, reps: 'Fast' }, { name: Math.random() > 0.5 ? '20m Sled Push' : '25 Wall Balls', sets: 1, reps: 'Heavy' }] },
      { id: 'C', name: 'Functional Strength', rounds: getRounds(3, intensity), exercises: [{ name: 'Sandbag Lunges', sets: 1, reps: '20 steps' }, { name: 'Farmers Carry', sets: 1, reps: '40m' }] },
      { id: 'D', name: 'Core/Midline', rounds: getRounds(3, intensity), exercises: [{ name: 'Kettlebell Swings', sets: 1, reps: '20 reps' }, { name: 'Plank', sets: 1, reps: '60 sec' }] }
    ];
  } else if (style === 'metabolic') {
    session.blocks = [
      { id: 'A', name: 'Strength Circuit', rounds: getRounds(4, intensity), exercises: pool.slice(0, 4).map(e => ({ ...e, sets: 1, reps: '15 reps' })) },
      { id: 'B', name: 'Conditioning', rounds: getRounds(4, intensity), exercises: [{ name: 'Box Jumps', sets: 1, reps: '12 reps' }, { name: 'Burpees', sets: 1, reps: '15 reps' }, { name: 'KB Swings', sets: 1, reps: '20 reps' }] },
      { id: 'C', name: 'Finisher', rounds: 1, exercises: [{ name: 'AMRAP: Push-ups + Squats', sets: 1, reps: 'Max in 2 min' }] }
    ];
  } else if (style === 'powerlifting') {
    session.exercises = [
      { name: pool[0]?.name || 'Main Lift', sets: 5, reps: '5 reps (Heavy)' },
      { name: pool[1]?.name || 'Secondary Variation', sets: 4, reps: '8 reps (Pause/Tempo)' },
      ...pool.slice(2, 5).map(e => ({ ...e, sets: 4, reps: '10 reps' })),
      { name: 'Heavy Core (Plank/Hanging Leg Raise)', sets: 3, reps: '60 sec' }
    ];
  }

  return session;
}

export function generateWorkoutPlan(profile: UserProfile): WorkoutSession[] {
  const { style, focus, trainDays, injuries, intensity = 'standard' } = profile;
  
  const isActive = (inj: Injury) => inj.status === 'active' || inj.status === 'recovering';
  const shInj = injuries.some(i => i.zone === 'shoulder' && isActive(i));
  const knInj = injuries.some(i => i.zone === 'knee' && isActive(i));
  
  const hasFocus = (f: string) => focus.includes(f);

  if (style === 'powerlifting') {
    return buildPLDays(trainDays, shInj, knInj, intensity);
  }
  if (style === 'metabolic') {
    return buildMetDays(trainDays, shInj, knInj, hasFocus('glutes'), hasFocus('arms'), intensity);
  }
  if (style === 'hyrox') {
    return buildHyroxDays(trainDays, shInj, knInj, intensity);
  }

  // Default to Block/Traditional style
  const pressEx = shInj ? { name: 'Machine Chest Press', reps: '12 reps' } : { name: 'Incline DB Press', reps: '10 reps' };
  const shBlock = shInj 
    ? [{ name: 'Machine Shoulder Press', reps: '12 reps' }, { name: 'Cable Lateral Raise', reps: '15 reps' }, { name: 'Machine Rear Delt Fly', reps: '15 reps' }]
    : [{ name: 'DB Arnold Press', reps: '12 reps' }, { name: 'Cable Lateral Raise', reps: '15 reps' }, { name: 'Machine Rear Delt Fly', reps: '15 reps' }];

  const plan = buildBlockDays(
    assignSplit(trainDays), 
    style, 
    pressEx, 
    shBlock, 
    shInj, 
    knInj, 
    hasFocus('arms'), 
    hasFocus('glutes'), 
    hasFocus('upper') || hasFocus('chest') || hasFocus('back') || hasFocus('shoulders'),
    intensity
  );
  
  return plan;
}

function getRounds(base: number, intensity: string) {
  if (intensity === 'quick') return Math.max(2, base - 1);
  if (intensity === 'killer') return base + 2;
  return base;
}

function buildHyroxDays(trainDays: string[], shInj: boolean, knInj: boolean, intensity: string): WorkoutSession[] {
  const days: WorkoutSession[] = [];
  const splits = ['engine', 'strength_endurance', 'power_speed', 'compromised'];
  let si = 0;

  DAYNAMES.forEach((d) => {
    if (trainDays.indexOf(d) === -1) {
      days.push({ id: d, name: d, type: 'Rest / Recovery', exercises: [], isRest: true } as any);
      return;
    }
    const split = splits[si % splits.length];
    si++;
    const day: WorkoutSession = { 
      id: d, 
      name: d, 
      type: '',
      volume: 0,
      exercises: [],
      warmup: '10 min: dynamic mobility + 500m easy row'
    };

    if (split === 'engine') {
      day.type = 'HYROX ENGINE';
      day.blocks = [
        {
          id: 'A',
          name: 'Engine Base',
          rounds: 1,
          exercises: [
            { name: '1000m Row or SkiErg', sets: 1, reps: 'Hard Effort' }
          ]
        },
        {
          id: 'B',
          name: 'Compromised Running',
          rounds: getRounds(4, intensity),
          exercises: [
            { name: '400m Run', sets: 1, reps: 'Fast' },
            { name: '25 Wall Balls', sets: 1, reps: 'Unbroken' }
          ]
        },
        {
          id: 'C',
          name: 'Functional Strength',
          rounds: getRounds(3, intensity),
          exercises: [
            { name: 'Sandbag Lunges', sets: 1, reps: '20 steps' },
            { name: 'Farmers Carry', sets: 1, reps: '40m' }
          ]
        },
        {
          id: 'D',
          name: 'Core/Midline',
          rounds: getRounds(3, intensity),
          exercises: [
            { name: 'Kettlebell Swings', sets: 1, reps: '20 reps' },
            { name: 'Plank', sets: 1, reps: '60 sec' }
          ]
        }
      ];
    } else if (split === 'strength_endurance') {
      day.type = 'HYROX STRENGTH';
      day.blocks = [
        {
          id: 'A',
          name: 'Engine Base',
          rounds: 1,
          exercises: [
            { name: '1000m Row or SkiErg', sets: 1, reps: 'Hard Effort' }
          ]
        },
        {
          id: 'B',
          name: 'Compromised Running',
          rounds: getRounds(4, intensity),
          exercises: [
            { name: '400m Run', sets: 1, reps: 'Fast' },
            { name: '20m Sled Push', sets: 1, reps: 'Heavy' }
          ]
        },
        {
          id: 'C',
          name: 'Functional Strength',
          rounds: getRounds(3, intensity),
          exercises: [
            { name: 'Sandbag Lunges', sets: 1, reps: '20 steps' },
            { name: 'Goblet Squat DB', sets: 1, reps: '15 reps' }
          ]
        },
        {
          id: 'D',
          name: 'Core/Midline',
          rounds: getRounds(3, intensity),
          exercises: [
            { name: 'Kettlebell Swings', sets: 1, reps: '20 reps' },
            { name: 'Plank', sets: 1, reps: '60 sec' }
          ]
        }
      ];
    } else if (split === 'power_speed') {
      day.type = 'HYROX POWER';
      day.blocks = [
        {
          id: 'A',
          name: 'Engine Base',
          rounds: 1,
          exercises: [
            { name: '1000m Row or SkiErg', sets: 1, reps: 'Hard Effort' }
          ]
        },
        {
          id: 'B',
          name: 'Compromised Running',
          rounds: getRounds(4, intensity),
          exercises: [
            { name: '400m Run', sets: 1, reps: 'Fast' },
            { name: '20m Sled Pull', sets: 1, reps: 'Fast' }
          ]
        },
        {
          id: 'C',
          name: 'Functional Strength',
          rounds: getRounds(3, intensity),
          exercises: [
            { name: 'Box Jumps', sets: 1, reps: '12 reps' },
            { name: 'Kettlebell Swings', sets: 1, reps: '20 reps' }
          ]
        },
        {
          id: 'D',
          name: 'Core/Midline',
          rounds: getRounds(3, intensity),
          exercises: [
            { name: 'Farmers Carry', sets: 1, reps: '40m' },
            { name: 'Plank', sets: 1, reps: '60 sec' }
          ]
        }
      ];
    } else {
      day.type = 'COMPROMISED RUNNING';
      day.blocks = [
        {
          id: 'A',
          name: 'Engine Base',
          rounds: 1,
          exercises: [
            { name: '1000m Row or SkiErg', sets: 1, reps: 'Hard Effort' }
          ]
        },
        {
          id: 'B',
          name: 'Compromised Running',
          rounds: getRounds(4, intensity),
          exercises: [
            { name: '400m Run', sets: 1, reps: 'Fast' },
            { name: '20 Burpee Broad Jumps', sets: 1, reps: 'Continuous' }
          ]
        },
        {
          id: 'C',
          name: 'Functional Strength',
          rounds: getRounds(3, intensity),
          exercises: [
            { name: '400m Run', sets: 1, reps: 'Fast' },
            { name: '25 Wall Balls', sets: 1, reps: 'Unbroken' }
          ]
        },
        {
          id: 'D',
          name: 'Core/Midline',
          rounds: getRounds(3, intensity),
          exercises: [
            { name: 'Kettlebell Swings', sets: 1, reps: '20 reps' },
            { name: 'Plank', sets: 1, reps: '60 sec' }
          ]
        }
      ];
    }
    days.push(day);
  });
  return days;
}

function assignSplit(trainDays: string[]) {
  const splits = ['back_arms', 'legs', 'back_shoulders_arms', 'chest_arms', 'legs_cardio', 'chest_arms_legs'];
  const result: { day: string; split: string; train: boolean }[] = [];
  let si = 0;
  
  DAYNAMES.forEach((d) => {
    if (trainDays.indexOf(d) !== -1) {
      result.push({ day: d, split: splits[si % splits.length], train: true });
      si++;
    } else {
      result.push({ day: d, split: 'rest', train: false });
    }
  });
  return result;
}

function buildBlockDays(asgn: any[], style: string, pressEx: any, shBlock: any[], shInj: boolean, knInj: boolean, aFocus: boolean, gFocus: boolean, uFocus: boolean, intensity: string): WorkoutSession[] {
  const days: WorkoutSession[] = [];

  asgn.forEach((a) => {
    if (!a.train) {
      days.push({
        id: a.day,
        name: a.day,
        type: 'Rest / Active Recovery',
        volume: 0,
        exercises: [],
        isRest: true
      });
      return;
    }

    const s = a.split;
    const day: WorkoutSession = { 
      id: a.day, 
      name: a.day, 
      type: '', 
      volume: 0, 
      exercises: [] 
    };

    day.warmup = '5 min: arm circles + band pull aparts + shoulder rolls';
    day.cardio = '20 min incline treadmill 12-15% / 3.0 mph';
    
    if (s === 'back_arms') {
      day.type = 'Back + Arms';
      if (style === 'traditional') {
        day.exercises = [
          { name: 'Lat Pulldown wide grip', sets: 4, reps: '8-10 reps' },
          { name: 'Seated Cable Row', sets: 4, reps: '10-12 reps' },
          { name: 'Machine Row', sets: 4, reps: '10-12 reps' },
          { name: 'Barbell Curl', sets: 4, reps: '10-12 reps' },
          { name: 'Cable Pushdown rope', sets: 4, reps: '10-12 reps' },
          { name: 'Hammer Curl', sets: 3, reps: '15 reps' },
          { name: 'Overhead Cable Extension', sets: 3, reps: '15 reps' }
        ];
      } else {
        day.blocks = [
          {
            id: 'A',
            name: 'Primary Compound',
            rounds: getRounds(4, intensity),
            exercises: [
              { name: 'Lat Pulldown wide grip', sets: 1, reps: '10 reps' },
              { name: 'Seated Cable Row', sets: 1, reps: '12 reps' }
            ]
          },
          {
            id: 'B',
            name: 'Secondary Compound',
            rounds: getRounds(4, intensity),
            exercises: [
              { name: 'Machine Row', sets: 1, reps: '12 reps' },
              { name: 'DB Single Arm Row', sets: 1, reps: '10 reps each' }
            ]
          },
          {
            id: 'C',
            name: 'Isolation/Volume',
            rounds: getRounds(3, intensity),
            exercises: [
              { name: 'Barbell Curl', sets: 1, reps: '10 reps' },
              { name: 'Cable Pushdown rope', sets: 1, reps: '12 reps' },
              { name: 'Incline DB Curl', sets: 1, reps: '12 reps' }
            ]
          },
          {
            id: 'D',
            name: 'Burnout',
            rounds: getRounds(3, intensity),
            exercises: [
              { name: 'Hammer Curl', sets: 1, reps: '15 reps' },
              { name: 'Cable Pushdown bar', sets: 1, reps: '15 reps' }
            ]
          }
        ];
      }
    } else if (s === 'legs') {
      day.type = 'Legs';
      if (style === 'traditional') {
        day.exercises = [
          { name: knInj ? 'Leg Press' : 'Hack Squat machine', sets: 4, reps: '8-10 reps' },
          { name: 'Leg Extension', sets: 4, reps: '12-15 reps' },
          { name: 'Romanian Deadlift DB', sets: 4, reps: '10-12 reps' },
          { name: gFocus ? 'Hip Thrust DB' : 'Walking Lunges DB', sets: 4, reps: '12 reps' },
          { name: 'Leg Curl seated', sets: 4, reps: '12-15 reps' },
          { name: 'Calf Raise machine', sets: 4, reps: '15-20 reps' }
        ];
      } else {
        day.blocks = [
          {
            id: 'A',
            name: 'Primary Power',
            rounds: getRounds(4, intensity),
            exercises: [
              { name: knInj ? 'Leg Press' : 'Hack Squat machine', sets: 1, reps: '12 reps' },
              { name: 'Leg Extension', sets: 1, reps: '15 reps' }
            ]
          },
          {
            id: 'B',
            name: 'Posterior Chain',
            rounds: getRounds(4, intensity),
            exercises: [
              { name: 'Romanian Deadlift DB', sets: 1, reps: '10 reps' },
              { name: gFocus ? 'Hip Thrust DB' : 'Walking Lunges DB', sets: 1, reps: '12 reps' }
            ]
          },
          {
            id: 'C',
            name: 'Isolation',
            rounds: getRounds(3, intensity),
            exercises: [
              { name: 'Leg Curl seated', sets: 1, reps: '15 reps' },
              { name: 'Abductor Machine', sets: 1, reps: '15 reps' }
            ]
          },
          {
            id: 'D',
            name: 'Calf/Core',
            rounds: getRounds(3, intensity),
            exercises: [
              { name: 'Calf Raise machine', sets: 1, reps: '20 reps' },
              { name: 'Cable Crunch', sets: 1, reps: '15 reps' }
            ]
          }
        ];
      }
    } else if (s === 'back_shoulders_arms') {
      day.type = 'Back + Shoulders + Arms';
      if (style === 'traditional') {
        day.exercises = [
          { name: 'Seated Cable Row', sets: 4, reps: '10-12 reps' },
          { name: 'Lat Pulldown close grip', sets: 4, reps: '10-12 reps' },
          ...shBlock.map(ex => ({ ...ex, sets: 3 })),
          { name: 'Cable Pushdown rope', sets: 3, reps: '12-15 reps' },
          { name: 'Barbell Curl', sets: 3, reps: '10-12 reps' }
        ];
      } else {
        day.blocks = [
          {
            id: 'A',
            name: 'Back Power',
            rounds: getRounds(4, intensity),
            exercises: [
              { name: 'Seated Cable Row', sets: 1, reps: '12 reps' },
              { name: 'Lat Pulldown close grip', sets: 1, reps: '12 reps' }
            ]
          },
          {
            id: 'B',
            name: 'Shoulder Sculpt',
            rounds: getRounds(3, intensity),
            exercises: shBlock.map(ex => ({ ...ex, sets: 1 }))
          },
          {
            id: 'C',
            name: 'Arm Volume',
            rounds: getRounds(4, intensity),
            exercises: [
              { name: 'Cable Pushdown rope', sets: 1, reps: '12 reps' },
              { name: 'Barbell Curl', sets: 1, reps: '10 reps' }
            ]
          },
          {
            id: 'D',
            name: 'Rear Delt/Core',
            rounds: getRounds(3, intensity),
            exercises: [
              { name: 'Machine Rear Delt Fly', sets: 1, reps: '15 reps' },
              { name: 'Plank', sets: 1, reps: '60 sec' }
            ]
          }
        ];
      }
    } else if (s === 'chest_arms') {
      day.type = 'Chest + Arms';
      if (style === 'traditional') {
        day.exercises = [
          { name: 'Machine Chest Press', sets: 4, reps: '10-12 reps' },
          { name: 'Machine Incline Press', sets: 4, reps: '10-12 reps' },
          { name: 'Pec Deck / Machine Fly', sets: 3, reps: '15 reps' },
          { name: 'Barbell Curl', sets: 4, reps: '10-12 reps' },
          { name: 'Cable Pushdown rope', sets: 4, reps: '10-12 reps' },
          { name: 'Hammer Curl', sets: 3, reps: '12-15 reps' }
        ];
      } else {
        day.blocks = [
          {
            id: 'A',
            name: 'Chest Power',
            rounds: getRounds(4, intensity),
            exercises: [
              { name: 'Machine Chest Press', sets: 1, reps: '12 reps' },
              { name: 'Machine Incline Press', sets: 1, reps: '12 reps' }
            ]
          },
          {
            id: 'B',
            name: 'Arm Priority',
            rounds: getRounds(4, intensity),
            exercises: [
              { name: 'Barbell Curl', sets: 1, reps: '10 reps' },
              { name: 'Cable Pushdown rope', sets: 1, reps: '10 reps' }
            ]
          },
          {
            id: 'C',
            name: 'Chest Isolation',
            rounds: getRounds(3, intensity),
            exercises: [
              { name: 'Pec Deck / Machine Fly', sets: 1, reps: '15 reps' },
              { name: 'Cable Fly low to high', sets: 1, reps: '15 reps' }
            ]
          },
          {
            id: 'D',
            name: 'Arm Burnout',
            rounds: getRounds(3, intensity),
            exercises: [
              { name: 'Hammer Curl', sets: 1, reps: '12 reps' },
              { name: 'Cable Pushdown bar', sets: 1, reps: '15 reps' }
            ]
          }
        ];
      }
    } else if (s === 'legs_cardio') {
      day.type = 'Active Recovery / Cardio';
      day.isCardio = true;
      day.exercises = [];
    } else {
      day.type = s.replace('_', ' ').toUpperCase();
      if (style === 'traditional') {
        day.exercises = [
          { name: 'Compound Movement', sets: 4, reps: '10 reps' },
          { name: 'Secondary Movement', sets: 4, reps: '12 reps' },
          { name: 'Isolation Movement', sets: 3, reps: '15 reps' },
          { name: 'Accessory Movement', sets: 3, reps: '15 reps' }
        ];
      } else {
        day.blocks = [
          {
            id: 'A',
            name: 'Main Block',
            rounds: getRounds(4, intensity),
            exercises: [
              { name: 'Compound Movement', sets: 1, reps: '10 reps' },
              { name: 'Isolation Movement', sets: 1, reps: '12 reps' }
            ]
          },
          {
            id: 'B',
            name: 'Volume Block',
            rounds: getRounds(4, intensity),
            exercises: [
              { name: 'Secondary Movement', sets: 1, reps: '12 reps' },
              { name: 'Accessory Movement', sets: 1, reps: '15 reps' }
            ]
          },
          {
            id: 'C',
            name: 'Core Block',
            rounds: getRounds(3, intensity),
            exercises: [
              { name: 'Plank', sets: 1, reps: '60 sec' },
              { name: 'Cable Crunch', sets: 1, reps: '15 reps' }
            ]
          },
          {
            id: 'D',
            name: 'Conditioning',
            rounds: getRounds(3, intensity),
            exercises: [
              { name: 'KB Swings', sets: 1, reps: '20 reps' },
              { name: 'Burpees', sets: 1, reps: '15 reps' }
            ]
          }
        ];
      }
    }
    days.push(day);
  });
  return days;
}

function buildPLDays(trainDays: string[], shInj: boolean, knInj: boolean, intensity: string): WorkoutSession[] {
  const days: WorkoutSession[] = [];
  const splits = ['squat', 'bench', 'deadlift', 'overhead', 'accessory'];
  let si = 0;

  DAYNAMES.forEach((d) => {
    if (trainDays.indexOf(d) === -1) {
      days.push({ id: d, name: d, type: 'Rest / Recovery', exercises: [], isRest: true } as any);
      return;
    }
    const split = splits[si % splits.length];
    si++;
    const day: WorkoutSession = { 
      id: d, 
      name: d, 
      type: '',
      volume: 0,
      exercises: [],
      warmup: '15 min: dynamic stretching + light sets of main lift'
    };

    if (split === 'squat') {
      day.type = 'Squat Day';
      day.exercises = [
        { name: knInj ? 'Leg Press' : 'Hack Squat machine', sets: 5, reps: '5 reps (Heavy)' },
        { name: knInj ? 'Hack Squat machine' : 'Leg Press', sets: 4, reps: '8 reps (Tempo)' },
        { name: 'Romanian Deadlift DB', sets: 4, reps: '10 reps' },
        { name: 'Leg Curl seated', sets: 4, reps: '10 reps' },
        { name: 'Glute Bridge', sets: 4, reps: '10 reps' },
        { name: 'Heavy Core (Plank)', sets: 3, reps: '60 sec' }
      ];
    } else if (split === 'bench') {
      day.type = 'Bench / Push Day';
      day.exercises = [
        { name: 'Machine Chest Press', sets: 5, reps: '5 reps (Heavy)' },
        { name: 'Machine Incline Press', sets: 4, reps: '8 reps (Tempo)' },
        { name: 'Close Grip Bench Press', sets: 4, reps: '10 reps' },
        { name: 'Cable Pushdown bar', sets: 4, reps: '10 reps' },
        { name: shInj ? 'Machine Shoulder Press' : 'DB Shoulder Press', sets: 4, reps: '10 reps' },
        { name: 'Heavy Core (Dead Bug)', sets: 3, reps: '60 sec' }
      ];
    } else if (split === 'deadlift') {
      day.type = 'Deadlift / Pull Day';
      day.exercises = [
        { name: 'Romanian Deadlift DB', sets: 5, reps: '5 reps (Heavy)' },
        { name: 'Seated Cable Row', sets: 4, reps: '8 reps (Tempo)' },
        { name: 'Lat Pulldown wide grip', sets: 4, reps: '10 reps' },
        { name: 'Barbell Curl', sets: 4, reps: '10 reps' },
        { name: 'Machine Rear Delt Fly', sets: 4, reps: '10 reps' },
        { name: 'Heavy Core (Hanging Leg Raise)', sets: 3, reps: '60 sec' }
      ];
    } else if (split === 'overhead') {
      day.type = 'Overhead Press Day';
      day.exercises = [
        { name: shInj ? 'Machine Shoulder Press' : 'DB Shoulder Press', sets: 5, reps: '5 reps (Heavy)' },
        { name: shInj ? 'DB Shoulder Press' : 'DB Arnold Press', sets: 4, reps: '8 reps (Tempo)' },
        { name: 'Lat Pulldown wide grip', sets: 4, reps: '10 reps' },
        { name: 'Machine Rear Delt Fly', sets: 4, reps: '10 reps' },
        { name: 'Skull Crushers EZ Bar', sets: 4, reps: '10 reps' },
        { name: 'Heavy Core (Plank)', sets: 3, reps: '60 sec' }
      ];
    } else {
      day.type = 'Accessory Day';
      day.exercises = [
        { name: 'Incline DB Curl', sets: 4, reps: '12 reps' },
        { name: 'Overhead Cable Extension', sets: 4, reps: '12 reps' },
        { name: 'Cable Crunch', sets: 4, reps: '15 reps' },
        { name: 'Leg Curl seated', sets: 4, reps: '15 reps' },
        { name: 'Calf Raise machine', sets: 4, reps: '20 reps' },
        { name: 'Heavy Core (Russian Twist)', sets: 3, reps: '60 sec' }
      ];
    }
    days.push(day);
  });
  return days;
}

function buildMetDays(trainDays: string[], shInj: boolean, knInj: boolean, gFocus: boolean, aFocus: boolean, intensity: string): WorkoutSession[] {
  const days: WorkoutSession[] = [];
  const splits = ['upper_met', 'lower_met', 'full_met', 'cardio_met'];
  let si = 0;

  DAYNAMES.forEach((d) => {
    if (trainDays.indexOf(d) === -1) {
      days.push({ id: d, name: d, type: 'Rest / Recovery', exercises: [], isRest: true } as any);
      return;
    }
    const split = splits[si % splits.length];
    si++;
    const day: WorkoutSession = { 
      id: d, 
      name: d, 
      type: '',
      volume: 0,
      exercises: [],
      warmup: '5 min: high rep light weight movements'
    };

    if (split === 'upper_met') {
      day.type = 'Upper Metabolic Circuit';
      day.blocks = [
        {
          id: 'A',
          name: 'Strength Circuit',
          rounds: getRounds(4, intensity),
          exercises: [
            { name: shInj ? 'Machine Chest Press' : 'Incline DB Press', sets: 1, reps: '15 reps' },
            { name: 'Seated Cable Row', sets: 1, reps: '15 reps' },
            { name: 'DB Shoulder Press', sets: 1, reps: '15 reps' },
            { name: 'Lat Pulldown wide grip', sets: 1, reps: '15 reps' }
          ]
        },
        {
          id: 'B',
          name: 'Conditioning',
          rounds: getRounds(4, intensity),
          exercises: [
            { name: 'Box Jumps', sets: 1, reps: '12 reps' },
            { name: 'Burpees', sets: 1, reps: '15 reps' },
            { name: 'KB Swings', sets: 1, reps: '20 reps' }
          ]
        },
        {
          id: 'C',
          name: 'Finisher',
          rounds: 1,
          exercises: [
            { name: 'AMRAP: Push-ups', sets: 1, reps: 'Max in 2 min' }
          ]
        }
      ];
    } else if (split === 'lower_met') {
      day.type = 'Lower Metabolic Circuit';
      day.blocks = [
        {
          id: 'A',
          name: 'Strength Circuit',
          rounds: getRounds(4, intensity),
          exercises: [
            { name: 'Leg Press', sets: 1, reps: '20 reps' },
            { name: gFocus ? 'Hip Thrust DB' : 'Romanian Deadlift DB', sets: 1, reps: '15 reps' },
            { name: 'Leg Extension', sets: 1, reps: '20 reps' },
            { name: 'Cable Kickback', sets: 1, reps: '15 reps each' }
          ]
        },
        {
          id: 'B',
          name: 'Conditioning',
          rounds: getRounds(4, intensity),
          exercises: [
            { name: 'Box Jumps', sets: 1, reps: '12 reps' },
            { name: 'Burpees', sets: 1, reps: '15 reps' },
            { name: 'Mountain Climbers', sets: 1, reps: '60 sec' }
          ]
        },
        {
          id: 'C',
          name: 'Finisher',
          rounds: 1,
          exercises: [
            { name: 'AMRAP: Squats', sets: 1, reps: 'Max in 2 min' }
          ]
        }
      ];
    } else if (split === 'full_met') {
      day.type = 'Full Body Metabolic';
      day.blocks = [
        {
          id: 'A',
          name: 'Strength Circuit',
          rounds: getRounds(4, intensity),
          exercises: [
            { name: 'Leg Press', sets: 1, reps: '15 reps' },
            { name: 'Machine Chest Press', sets: 1, reps: '15 reps' },
            { name: 'Seated Cable Row', sets: 1, reps: '15 reps' },
            { name: 'DB Shoulder Press', sets: 1, reps: '12 reps' }
          ]
        },
        {
          id: 'B',
          name: 'Conditioning',
          rounds: getRounds(4, intensity),
          exercises: [
            { name: 'Burpees', sets: 1, reps: '15 reps' },
            { name: 'KB Swings', sets: 1, reps: '20 reps' },
            { name: 'Box Jumps', sets: 1, reps: '12 reps' }
          ]
        },
        {
          id: 'C',
          name: 'Finisher',
          rounds: 1,
          exercises: [
            { name: 'AMRAP: Burpees', sets: 1, reps: 'Max in 2 min' }
          ]
        }
      ];
    } else {
      day.type = 'Active Cardio Day';
      day.isCardio = true;
      day.exercises = [];
    }
    days.push(day);
  });
  return days;
}

export function randomizeExercises(sessions: WorkoutSession[]): WorkoutSession[] {
  return sessions.map(session => {
    if (session.exercises.length === 0) return session;

    const newExercises = session.exercises.map(ex => {
      if (Math.random() > 0.45) {
        // Find category
        const category = Object.keys(EXDB).find(k => EXDB[k].some(x => x.n === ex.name));
        if (category) {
          const pool = EXDB[category].filter(x => x.n !== ex.name);
          if (pool.length) {
            const picked = pool[Math.floor(Math.random() * pool.length)];
            return { ...ex, name: picked.n };
          }
        }
      }
      return ex;
    });

    return { ...session, exercises: newExercises };
  });
}
