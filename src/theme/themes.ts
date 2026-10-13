export const themeIds = ['terracotta', 'lavender', 'seaGlass', 'sunny', 'blueberry'] as const

export type ThemeId = typeof themeIds[number]

interface AppTheme {
  accent: string
  statusBarColor: string
  variables: Record<string, string>
  labelKey:
    | 'settings.theme.terracotta'
    | 'settings.theme.lavender'
    | 'settings.theme.seaGlass'
    | 'settings.theme.sunny'
    | 'settings.theme.blueberry'
}

export const appThemes: Record<ThemeId, AppTheme> = {
  terracotta: {
    accent: '#c96345',
    statusBarColor: '#99432c',
    labelKey: 'settings.theme.terracotta',
    variables: {
      '--color-cream': '#fff8ea',
      '--color-terracotta': '#c96345',
      '--color-dark-blue': '#233a55',
      '--color-mint': '#a9d8bf',
      '--color-surface': '#fffdf8',
      '--color-border': '#d9cbb7',
      '--color-focus-ring': '#245d8d',
      '--shadow-soft': '0 10px 32px rgb(35 58 85 / 12%)',
    },
  },
  lavender: {
    accent: '#8f5aa8',
    statusBarColor: '#633a78',
    labelKey: 'settings.theme.lavender',
    variables: {
      '--color-cream': '#fcf8ff',
      '--color-terracotta': '#8f5aa8',
      '--color-dark-blue': '#352d4d',
      '--color-mint': '#b9dec9',
      '--color-surface': '#fffcff',
      '--color-border': '#dccee7',
      '--color-focus-ring': '#5867b4',
      '--shadow-soft': '0 10px 32px rgb(53 45 77 / 12%)',
    },
  },
  seaGlass: {
    accent: '#2c8a7d',
    statusBarColor: '#1b635b',
    labelKey: 'settings.theme.seaGlass',
    variables: {
      '--color-cream': '#eff9f7',
      '--color-terracotta': '#2c8a7d',
      '--color-dark-blue': '#193c4a',
      '--color-mint': '#9ed7c9',
      '--color-surface': '#fbfffe',
      '--color-border': '#c3ddd8',
      '--color-focus-ring': '#126d86',
      '--shadow-soft': '0 10px 32px rgb(25 60 74 / 12%)',
    },
  },
  sunny: {
    accent: '#d88721',
    statusBarColor: '#91580f',
    labelKey: 'settings.theme.sunny',
    variables: {
      '--color-cream': '#fff8d8',
      '--color-terracotta': '#d88721',
      '--color-dark-blue': '#493828',
      '--color-mint': '#bcd790',
      '--color-surface': '#fffdf2',
      '--color-border': '#e5d3a8',
      '--color-focus-ring': '#8b5b14',
      '--shadow-soft': '0 10px 32px rgb(73 56 40 / 12%)',
    },
  },
  blueberry: {
    accent: '#3d73c7',
    statusBarColor: '#285595',
    labelKey: 'settings.theme.blueberry',
    variables: {
      '--color-cream': '#f3f7ff',
      '--color-terracotta': '#3d73c7',
      '--color-dark-blue': '#1f365d',
      '--color-mint': '#a9cdeb',
      '--color-surface': '#fcfdff',
      '--color-border': '#c9d8ed',
      '--color-focus-ring': '#245ea8',
      '--shadow-soft': '0 10px 32px rgb(31 54 93 / 12%)',
    },
  },
}
