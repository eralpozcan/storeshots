// Quick-start templates — pre-fill the editor with sensible defaults so a new
// user has something to react to instead of a blank canvas. Templates only
// touch tone-of-voice fields (headlines, palette) and never overwrite the
// user's own assets (icon, screenshots) or AI credentials.

import type { BrandColors, SlideCopy } from './types'

export type StartTemplate = {
  key: string
  label: string
  emoji: string
  description: string
  colors: BrandColors
  copy: SlideCopy[]
  features: string[]
}

const slide = (label: string, headline: string): SlideCopy => ({ label, headline })

export const START_TEMPLATES: StartTemplate[] = [
  {
    key: 'saas',
    label: 'SaaS / Productivity',
    emoji: '⚡',
    description: 'Calm gradients, time-saving tone. Good for tools and dashboards.',
    colors: {
      primary: '#2563eb',
      accent: '#f97316',
      textDark: '#0f172a',
      textLight: '#ffffff',
      bgFrom: '#0f172a',
      bgTo: '#1e3a8a',
    },
    features: ['Saves hours every week', 'Works on every device', 'Built for teams'],
    copy: [
      slide('HERO', 'Get back\nyour week.'),
      slide('FOCUS', 'Cut the busywork.\nKeep the work.'),
      slide('TEAM', 'Everyone in sync.\nNo Slack pings.'),
      slide('SECURE', 'SOC 2 ready.\nFor real.'),
      slide('FAST', 'Loads in\nunder a second.'),
      slide('AUTOMATE', 'Repeat tasks?\nAutomate them.'),
      slide('INSIGHT', 'See where\ntime goes.'),
      slide('CONNECT', 'Plays nice\nwith your stack.'),
      slide('GROW', 'Scales as\nyou grow.'),
      slide('TRUST', 'Made for\nbuilders.'),
    ],
  },
  {
    key: 'game',
    label: 'Game / Entertainment',
    emoji: '🎮',
    description: 'High-energy palette and punchy headlines for games and arcade apps.',
    colors: {
      primary: '#ec4899',
      accent: '#facc15',
      textDark: '#0b021a',
      textLight: '#ffffff',
      bgFrom: '#1e0036',
      bgTo: '#5b0066',
    },
    features: ['100+ unique levels', 'Compete with friends', 'Offline mode'],
    copy: [
      slide('HERO', 'One more\nlevel. Promise.'),
      slide('PLAY', 'Pick up.\nLose hours.'),
      slide('LEVELS', '100+ ways\nto win.'),
      slide('FRIENDS', 'Race friends.\nWreck their score.'),
      slide('REWARDS', 'Daily streaks.\nReal payoff.'),
      slide('OFFLINE', 'No wifi?\nNo problem.'),
      slide('SKINS', 'Unlock looks.\nFlex hard.'),
      slide('LEADER', 'Climb the\nleaderboard.'),
      slide('NEW', 'New levels\nevery week.'),
      slide('TRUST', 'Built for\nplayers.'),
    ],
  },
  {
    key: 'finance',
    label: 'Finance / Fintech',
    emoji: '💳',
    description: 'Confident, trust-forward palette and copy for banking and money apps.',
    colors: {
      primary: '#0f766e',
      accent: '#fbbf24',
      textDark: '#022c22',
      textLight: '#ffffff',
      bgFrom: '#022c22',
      bgTo: '#064e3b',
    },
    features: ['Bank-grade encryption', 'Track every dollar', 'No hidden fees'],
    copy: [
      slide('HERO', 'Money made\nclear.'),
      slide('SAVE', 'Save without\nthinking.'),
      slide('TRACK', 'See every\ndollar.'),
      slide('SECURE', 'Bank-grade.\nReally.'),
      slide('NO FEES', 'Zero hidden\nfees. Ever.'),
      slide('GOALS', 'Hit goals\nfaster.'),
      slide('INVEST', 'Invest with\nconfidence.'),
      slide('SUPPORT', '24/7 humans.\nNot bots.'),
      slide('GLOBAL', 'Works in\n100+ countries.'),
      slide('TRUST', 'Trusted by\nmillions.'),
    ],
  },
  {
    key: 'health',
    label: 'Health / Wellness',
    emoji: '🌿',
    description: 'Soft, encouraging palette for fitness, meditation, and wellness apps.',
    colors: {
      primary: '#16a34a',
      accent: '#fb923c',
      textDark: '#0a2e1a',
      textLight: '#ffffff',
      bgFrom: '#052e1a',
      bgTo: '#166534',
    },
    features: ['Gentle reminders', 'Track real progress', 'No guilt, ever'],
    copy: [
      slide('HERO', 'Small steps,\nbig wins.'),
      slide('DAILY', 'Five minutes\na day.'),
      slide('PROGRESS', 'See how\nfar you came.'),
      slide('COACH', 'Your coach,\nin your pocket.'),
      slide('MIND', 'Quiet the\nnoise.'),
      slide('SLEEP', 'Sleep deeper.\nWake stronger.'),
      slide('HABITS', 'Habits that\nstick.'),
      slide('COMMUNITY', 'You\'re not\nalone here.'),
      slide('FLEX', 'No guilt.\nNo streaks lost.'),
      slide('TRUST', 'Built with\nclinicians.'),
    ],
  },
]
