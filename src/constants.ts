import { Frequency, Injury } from './types';

export const ZONE_ORDER = ['shoulder', 'knee', 'back', 'wrist', 'elbow', 'hip', 'neck'];

export const INDB: Injury[] = [
  { id: 'hill_sachs', name: 'Hill-Sachs Lesion', zone: 'shoulder', avoid: ['Low-bar Squat', 'Behind-neck Press', 'Upright Row', 'Deep Dips'], safe: ['Machine Chest Press', 'Cable Row', 'Lat Pulldown', 'Machine Shoulder Press'] },
  { id: 'rotator', name: 'Rotator Cuff Strain', zone: 'shoulder', avoid: ['Barbell Overhead Press', 'Behind-neck Press', 'Upright Row', 'Dips'], safe: ['Cable Lateral Raise', 'Machine Chest Press', 'Seated Row', 'Face Pull'] },
  { id: 'impingement', name: 'Shoulder Impingement', zone: 'shoulder', avoid: ['Overhead Press barbell', 'Upright Row', 'Wide-grip Pull-up'], safe: ['Machine Shoulder Press', 'Neutral-grip Pulldown', 'Cable Row', 'Face Pull'] },
  { id: 'labrum', name: 'Labrum Tear', zone: 'shoulder', avoid: ['Heavy Bench Press', 'Dips', 'Deep Fly stretch'], safe: ['Machine Chest Press', 'Cable Fly', 'Lat Pulldown', 'Seated Row'] },
  { id: 'patellar', name: 'Patellar Tendinitis', zone: 'knee', avoid: ['Full Squat', 'Heavy Leg Extension', 'Running', 'Box Jump'], safe: ['Leg Press partial', 'Leg Curl', 'Hip Thrust', 'RDL'] },
  { id: 'acl', name: 'ACL Tear/Reconstruction', zone: 'knee', avoid: ['Barbell Squat', 'Heavy Lunge', 'Leg Extension', 'Box Jump'], safe: ['Leg Press', 'Hip Thrust', 'Leg Curl', 'Calf Raise'] },
  { id: 'meniscus', name: 'Meniscus Tear', zone: 'knee', avoid: ['Deep Squat', 'Heavy Leg Press', 'Leg Extension'], safe: ['Partial Leg Press', 'Hip Thrust', 'Glute Bridge', 'Leg Curl'] },
  { id: 'herniated', name: 'Herniated Disc', zone: 'back', avoid: ['Barbell Deadlift', 'Barbell Squat', 'Good Morning', 'Sit-up'], safe: ['Hip Thrust', 'Glute Bridge', 'Cable Pull Through', 'Lat Pulldown'] },
  { id: 'sciatica', name: 'Sciatica', zone: 'back', avoid: ['Barbell Deadlift', 'Barbell Squat', 'Deep Leg Press'], safe: ['Hip Thrust', 'Glute Bridge', 'Lat Pulldown'] },
  { id: 'lbstrain', name: 'Lower Back Strain', zone: 'back', avoid: ['Barbell Deadlift', 'Good Morning', 'Barbell Row'], safe: ['Machine Row', 'Lat Pulldown', 'Hip Thrust', 'Plank'] },
  { id: 'wrist_t', name: 'Wrist Tendinitis', zone: 'wrist', avoid: ['Straight Bar Curl', 'Wrist Curl', 'Push-up'], safe: ['EZ Bar Curl', 'Hammer Curl', 'Cable Pushdown rope', 'Machine Press'] },
  { id: 'carpal', name: 'Carpal Tunnel', zone: 'wrist', avoid: ['Straight bar pressing', 'Push-up', 'Plank on hands'], safe: ['EZ Bar', 'Hammer Curl', 'Cable exercises', 'Machine pressing'] },
  { id: 'tennis_e', name: 'Tennis Elbow', zone: 'elbow', avoid: ['Barbell Curl', 'Reverse Curl', 'Wrist Extension'], safe: ['Hammer Curl', 'Cable Pushdown rope', 'Lat Pulldown'] },
  { id: 'golfer_e', name: "Golfer's Elbow", zone: 'elbow', avoid: ['Heavy DB Curl', 'Wrist Curl', 'Pull-up'], safe: ['Machine Row', 'Lat Pulldown neutral', 'Cable Pushdown'] },
  { id: 'hipflex', name: 'Hip Flexor Strain', zone: 'hip', avoid: ['Sprint', 'Box Jump', 'Heavy Lunge', 'Leg Raise'], safe: ['Hip Thrust', 'Leg Curl', 'Upper Body'] },
  { id: 'fai', name: 'Hip Impingement FAI', zone: 'hip', avoid: ['Deep Squat', 'Barbell Squat', 'Deep Leg Press'], safe: ['Partial Leg Press', 'Hip Thrust', 'Glute Bridge', 'Leg Curl'] },
  { id: 'cervical', name: 'Cervical Strain Neck', zone: 'neck', avoid: ['Behind-neck Press', 'Behind-neck Pulldown', 'Heavy Shrug'], safe: ['Machine Chest Press', 'Lat Pulldown front', 'Cable Row'] },
];

export const EXDB: Record<string, { n: string; d: string }[]> = {
  chest: [
    { n: 'Machine Chest Press', d: 'Shoulder-safe, great for isolation' },
    { n: 'Pec Deck / Machine Fly', d: 'Peak contraction, keep elbows slightly bent' },
    { n: 'Machine Incline Press', d: 'Upper chest emphasis' },
    { n: 'Cable Fly low to high', d: 'Full stretch, constant tension' },
    { n: 'Cable Fly high to low', d: 'Lower chest emphasis' },
    { n: 'Incline DB Press', d: 'Upper chest + front delt' },
    { n: 'Flat DB Press', d: 'Full chest stretch' },
    { n: 'DB Floor Press', d: 'Safe, no shoulder hyperextension' }
  ],
  back: [
    { n: 'Lat Pulldown wide grip', d: 'Width builder, lean back slightly' },
    { n: 'Lat Pulldown close grip', d: 'Thickness + lower lat' },
    { n: 'Seated Cable Row', d: 'Mid back, keep chest up' },
    { n: 'Machine Row', d: 'Controlled, great for any level' },
    { n: 'DB Single Arm Row', d: 'Unilateral, heavy weight OK' },
    { n: 'Cable Face Pull', d: 'Rear delt + rotator cuff health' },
    { n: 'Straight Arm Pulldown', d: 'Lat isolation, no bicep' },
    { n: 'Barbell Row', d: 'Compound mass builder' },
    { n: 'Chest Supported Row', d: 'Eliminates lower back from equation' }
  ],
  shoulders: [
    { n: 'Machine Shoulder Press', d: 'Joint-safe pressing' },
    { n: 'DB Shoulder Press', d: 'Natural arc, good ROM' },
    { n: 'DB Arnold Press', d: 'Full rotation, hits all 3 heads' },
    { n: 'DB Lateral Raise', d: 'Side delt isolation, control the descent' },
    { n: 'Cable Lateral Raise', d: 'Constant tension vs dumbbells' },
    { n: 'DB Front Raise', d: 'Front delt' },
    { n: 'Machine Rear Delt Fly', d: 'Posterior delt, squeeze at peak' },
    { n: 'Cable Face Pull', d: 'Rear delt + upper back health' }
  ],
  biceps: [
    { n: 'Barbell Curl', d: 'Heavy compound, king of bicep mass' },
    { n: 'EZ Bar Curl', d: 'Easier on wrists than straight bar' },
    { n: 'Incline DB Curl', d: 'Long head stretch, slow eccentric' },
    { n: 'Hammer Curl', d: 'Brachialis + brachioradialis' },
    { n: 'Cable Curl bar', d: 'Constant tension, squeeze at top' },
    { n: 'Cable Curl rope', d: 'Neutral grip variation' },
    { n: 'Preacher Curl', d: 'Eliminates cheating, peak contraction' },
    { n: 'Concentration Curl', d: 'Pure isolation, classic Arnold' }
  ],
  triceps: [
    { n: 'Cable Pushdown rope', d: 'Spread rope at bottom, flex hard' },
    { n: 'Cable Pushdown bar', d: 'More weight, good for overload' },
    { n: 'V-Bar Pushdown', d: 'Narrow grip, outer head' },
    { n: 'Overhead Cable Extension', d: 'Long head stretch, key for size' },
    { n: 'Skull Crushers EZ Bar', d: 'Mass builder, control descent' },
    { n: 'DB Overhead Extension', d: 'Seated or standing' },
    { n: 'Machine Tricep Press', d: 'Finishing move, high reps' },
    { n: 'Close Grip Bench Press', d: 'Compound tricep mass builder' }
  ],
  legs: [
    { n: 'Leg Press', d: 'Knee-friendly quad builder' },
    { n: 'Hack Squat machine', d: 'Quad emphasis, safer than barbell' },
    { n: 'Goblet Squat DB', d: 'Great form builder' },
    { n: 'Leg Extension', d: 'Quad isolation' },
    { n: 'Leg Curl seated', d: 'Hamstring isolation' },
    { n: 'Leg Curl lying', d: 'Different angle, great stretch' },
    { n: 'Romanian Deadlift DB', d: 'Hamstring + glute, hinge at hip' },
    { n: 'Walking Lunges DB', d: 'Unilateral, great for balance' },
    { n: 'Reverse Lunges DB', d: 'Less knee stress' },
    { n: 'Calf Raise machine', d: 'High reps, full ROM' },
    { n: 'Seated Calf Raise', d: 'Targets soleus specifically' }
  ],
  glutes: [
    { n: 'Hip Thrust barbell', d: 'King of glute exercises' },
    { n: 'Hip Thrust DB', d: 'Same movement, lighter load' },
    { n: 'Glute Bridge', d: 'Floor variation' },
    { n: 'Cable Kickback', d: 'Isolation, control at top' },
    { n: 'Cable Pull Through', d: 'Hip hinge, glute focus' },
    { n: 'Sumo Squat DB', d: 'Wide stance hits glutes more' },
    { n: 'Abductor Machine', d: 'Outer glute + hip' },
    { n: 'Bulgarian Split Squat', d: 'Advanced, high glute activation' }
  ],
  abs: [
    { n: 'Cable Crunch', d: 'Weighted, better than floor crunches' },
    { n: 'Hanging Leg Raise', d: 'Lower abs + hip flexors' },
    { n: 'Plank', d: 'Isometric, full core' },
    { n: 'Ab Wheel Rollout', d: 'Advanced, full core challenge' },
    { n: 'Russian Twist', d: 'Obliques, controlled rotation' },
    { n: 'Dead Bug', d: 'Anti-rotation, stability' },
    { n: 'Decline Sit-up', d: 'Classic, add weight to progress' },
    { n: 'Bicycle Crunch', d: 'Obliques + rectus abdominis' }
  ],
};
export const FREQUENCIES: Frequency[] = [
  {
    id: '011',
    name: 'THE NEON SHADOW',
    description: 'Deep electric violet meets the absolute silence of charcoal.',
    vibe: 'High Contrast • Digital Noir',
    colors: { bg: '#0A0A0C', card: '#14141A', accent: '#4B0082' }
  },
  {
    id: '012',
    name: 'THE ARCHITECT',
    description: 'A clinical study in warm white, bone, and surgical light gray.',
    vibe: 'Default • Clinical • Minimal',
    colors: { bg: '#F5F2EB', card: '#FFFFFF', accent: '#5A6B7C' }
  },
  {
    id: '013',
    name: 'THE KINETIC',
    description: 'High-visibility chemical yellow on a void of deep industrial black.',
    vibe: 'Motion • Pulse • Energy',
    colors: { bg: '#050505', card: '#0A0A0A', accent: '#DFFF00' }
  },
  {
    id: '014',
    name: 'THE MUSE',
    description: 'Metallic performance pink tempered by sophisticated dark graphite.',
    vibe: 'Sophisticated • Performance',
    colors: { bg: '#121214', card: '#1A1A1E', accent: '#E8A0A8' }
  },
  {
    id: '015',
    name: 'THE PHANTOM',
    description: 'Deep nocturnal evergreen and matte black for low-profile dominance.',
    vibe: 'Nocturnal • Stealth',
    colors: { bg: '#020A05', card: '#05100A', accent: '#004D2C' }
  },
  {
    id: '016',
    name: 'THE ENGINE',
    description: 'Monochromatic mastery. Graphite textures and silver precision.',
    vibe: 'Industrial • Precision',
    colors: { bg: '#111111', card: '#1C1C1C', accent: '#E0E0E0' }
  },
];
