// CASHPOP Game Configuration

export const MINING_BASE_RATE = 0.5; // Rp per minute base

export const BOOSTERS = [
  {
    id: 'basic',
    name: 'Basic Miner',
    icon: 'flash-on',
    color: '#4ECDC4',
    multiplier: 2,
    description: '2× Hash Rate',
    prices: [
      { duration: 24, label: '24 Jam', price: 500 },
      { duration: 72, label: '3 Hari', price: 1200 },
      { duration: 120, label: '5 Hari', price: 1800 },
      { duration: 168, label: '7 Hari', price: 2400 },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Miner',
    icon: 'bolt',
    color: '#8B5CF6',
    multiplier: 5,
    description: '5× Hash Rate',
    prices: [
      { duration: 24, label: '24 Jam', price: 1000 },
      { duration: 72, label: '3 Hari', price: 2500 },
      { duration: 120, label: '5 Hari', price: 3800 },
      { duration: 168, label: '7 Hari', price: 5000 },
    ],
  },
  {
    id: 'turbo',
    name: 'Turbo Miner',
    icon: 'rocket',
    color: '#FF8C42',
    multiplier: 10,
    description: '10× Hash Rate',
    prices: [
      { duration: 24, label: '24 Jam', price: 2000 },
      { duration: 72, label: '3 Hari', price: 5000 },
      { duration: 120, label: '5 Hari', price: 7500 },
      { duration: 168, label: '7 Hari', price: 10000 },
    ],
  },
  {
    id: 'ultra',
    name: 'Ultra Miner',
    icon: 'stars',
    color: '#FFD700',
    multiplier: 25,
    description: '25× Hash Rate',
    prices: [
      { duration: 24, label: '24 Jam', price: 5000 },
      { duration: 72, label: '3 Hari', price: 12000 },
      { duration: 120, label: '5 Hari', price: 18000 },
      { duration: 168, label: '7 Hari', price: 25000 },
    ],
  },
];

export const SPIN_PRIZES = [
  { label: 'Rp50', value: 50, type: 'cash', color: '#4ECDC4', weight: 25 },
  { label: 'Rp100', value: 100, type: 'cash', color: '#00FF7F', weight: 20 },
  { label: 'Rp200', value: 200, type: 'cash', color: '#8B5CF6', weight: 15 },
  { label: 'Rp500', value: 500, type: 'cash', color: '#FF8C42', weight: 10 },
  { label: 'Rp750', value: 750, type: 'cash', color: '#FF6B9D', weight: 8 },
  { label: 'Rp1000', value: 1000, type: 'cash', color: '#FFD700', weight: 5 },
  { label: '+2h Basic', value: 2, type: 'booster_basic', color: '#4ECDC4', weight: 10 },
  { label: '+1h Pro', value: 1, type: 'booster_pro', color: '#A78BFA', weight: 7 },
];

export const DAILY_CHECKIN_REWARD = 200;
export const ADS_REWARD = 10;
export const ADS_DAILY_LIMIT = 20;
export const REFERRAL_REWARD = 500;
export const REFERRAL_DAILY_LIMIT = 10;

export const WITHDRAWAL_MIN = 10000;
export const WITHDRAWAL_MAX_PER_DAY = 1;
export const WITHDRAWAL_ADS_REQUIREMENT = 350;

export const CHECKIN_REWARD = 200;
