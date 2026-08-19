// CashPoP Game Configuration

export const MINING_BASE_RATE = 0.5; // Rp per minute base

export const ADMOB_IDS = {
  APP_ID: 'ca-app-pub-6881903056221433~3325421892',
  BANNER: 'ca-app-pub-6881903056221433/7424449002',
  INTERSTITIAL: 'ca-app-pub-6881903056221433/7727701333',
  REWARDED: 'ca-app-pub-6881903056221433/1162292985',
};

export const PLAYSTORE_BASE_URL = 'https://play.google.com/store/apps/details?id=com.altomedia.cashpop&ref=';

export const BOOSTERS = [
  {
    id: 'basic',
    name: 'Basic Miner',
    icon: 'flash-on',
    color: '#4ECDC4',
    multiplier: 2,
    description: '2× Hash Rate',
    prices: [
      { duration: 24, label: '24 Jam', price: 10000 },
      { duration: 72, label: '3 Hari', price: 24000 },
      { duration: 120, label: '5 Hari', price: 36000 },
      { duration: 168, label: '7 Hari', price: 48000 },
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
      { duration: 24, label: '24 Jam', price: 20000 },
      { duration: 72, label: '3 Hari', price: 50000 },
      { duration: 120, label: '5 Hari', price: 76000 },
      { duration: 168, label: '7 Hari', price: 100000 },
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
      { duration: 24, label: '24 Jam', price: 40000 },
      { duration: 72, label: '3 Hari', price: 100000 },
      { duration: 120, label: '5 Hari', price: 150000 },
      { duration: 168, label: '7 Hari', price: 200000 },
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
      { duration: 24, label: '24 Jam', price: 100000 },
      { duration: 72, label: '3 Hari', price: 240000 },
      { duration: 120, label: '5 Hari', price: 360000 },
      { duration: 168, label: '7 Hari', price: 500000 },
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
  { label: '+2j Basic', value: 2, type: 'booster_basic', color: '#4ECDC4', weight: 10 },
  { label: '+1j Pro', value: 1, type: 'booster_pro', color: '#A78BFA', weight: 7 },
];

// Streak rewards by milestone
export const STREAK_REWARDS: { days: number; reward: number }[] = [
  { days: 1, reward: 200 },
  { days: 3, reward: 300 },
  { days: 7, reward: 500 },
  { days: 30, reward: 1000 },
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

// Interstitial interval in ms (20 minutes)
export const INTERSTITIAL_INTERVAL_MS = 20 * 60 * 1000;

// Leaderboard mock data (simulated top miners)
export const MOCK_LEADERBOARD = [
  { id: '1', name: 'Budi S.', danaNumber: '081234****89', totalEarned: 485000, referralCode: '123489' },
  { id: '2', name: 'Sari W.', danaNumber: '082345****12', totalEarned: 372500, referralCode: '234512' },
  { id: '3', name: 'Andi P.', danaNumber: '085678****34', totalEarned: 298000, referralCode: '567834' },
  { id: '4', name: 'Dewi R.', danaNumber: '087890****56', totalEarned: 241500, referralCode: '789056' },
  { id: '5', name: 'Reza M.', danaNumber: '081122****78', totalEarned: 198000, referralCode: '112278' },
  { id: '6', name: 'Fitri A.', danaNumber: '089988****90', totalEarned: 167500, referralCode: '998890' },
  { id: '7', name: 'Hendra K.', danaNumber: '083344****11', totalEarned: 142000, referralCode: '344111' },
  { id: '8', name: 'Maya L.', danaNumber: '085566****22', totalEarned: 118500, referralCode: '566222' },
  { id: '9', name: 'Doni F.', danaNumber: '087788****33', totalEarned: 95000, referralCode: '788333' },
  { id: '10', name: 'Rina T.', danaNumber: '081199****44', totalEarned: 78500, referralCode: '199444' },
];
