import celebrateCat from '../../assets/mascot/celebrate.png'
import blueberryCelebrateCat from '../../assets/mascot/blueberry-celebrate.png'
import lavenderCelebrateCat from '../../assets/mascot/lavender-celebrate.png'
import seaGlassCelebrateCat from '../../assets/mascot/sea-glass-celebrate.png'
import sunnyCelebrateCat from '../../assets/mascot/sunny-celebrate.png'
import type { Locale } from '../../domain/types'
import { appThemes, type ThemeId } from '../../theme/themes'

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1350
export const POMOKITTY_URL = 'https://pavelnasuta.github.io/pomokitty/'

export interface StatsShareCardInput {
  childName: string
  todayMinutes: number
  weekMinutes: number
  cats: number
  locale: Locale
  theme: ThemeId
}

interface StatsShareTextInput extends Omit<StatsShareCardInput, 'theme'> {
  appUrl?: string
}

export function createStatsShareText({
  childName,
  todayMinutes,
  weekMinutes,
  cats,
  locale,
  appUrl = POMOKITTY_URL,
}: StatsShareTextInput): string {
  if (locale === 'en') {
    return `${childName} collected ${cats} cats 🐾\n\nToday: ${todayMinutes} min of focus\nThis week: ${weekMinutes} min\n\npomokitty helps make time for focus and rest.\n${appUrl}`
  }

  return `${childName}: уже ${cats} котиков 🐾\n\nСегодня: ${todayMinutes} мин фокуса\nЗа неделю: ${weekMinutes} мин\n\npomokitty помогает делать дела короткими спокойными раундами и вовремя отдыхать.\n${appUrl}`
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}

function drawText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ')
  let line = ''
  let lineY = y

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word
    if (context.measureText(nextLine).width > maxWidth && line) {
      context.fillText(line, x, lineY)
      line = word
      lineY += lineHeight
    } else {
      line = nextLine
    }
  }
  context.fillText(line, x, lineY)
}

const cardMascots: Record<ThemeId, string> = {
  terracotta: celebrateCat,
  lavender: lavenderCelebrateCat,
  seaGlass: seaGlassCelebrateCat,
  sunny: sunnyCelebrateCat,
  blueberry: blueberryCelebrateCat,
}

async function loadCardMascot(theme: ThemeId): Promise<HTMLImageElement> {
  const image = new Image()
  image.src = cardMascots[theme]
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Could not load the pomokitty mascot.'))
  })
  return image
}

function drawStatCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: string,
  label: string,
  colors: { surface: string; border: string; ink: string; accent: string },
  highlighted = false,
) {
  roundedRect(context, x, y, 405, 164, 28)
  context.fillStyle = highlighted ? colors.accent : colors.surface
  context.fill()
  if (!highlighted) {
    context.lineWidth = 2
    context.strokeStyle = colors.border
    context.stroke()
  }
  context.fillStyle = highlighted ? colors.surface : colors.accent
  context.font = '800 56px ui-rounded, "SF Pro Rounded", system-ui, sans-serif'
  context.fillText(value, x + 30, y + 72)
  context.fillStyle = highlighted ? 'rgba(255,255,255,.84)' : colors.ink
  context.font = '650 23px ui-rounded, "SF Pro Rounded", system-ui, sans-serif'
  context.fillText(label, x + 30, y + 124)
}

export async function createStatsShareImage(input: StatsShareCardInput): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the share image.')

  const variables = appThemes[input.theme].variables
  const colors = {
    cream: variables['--color-cream'],
    surface: variables['--color-surface'],
    accent: variables['--color-terracotta'],
    ink: variables['--color-dark-blue'],
    mint: variables['--color-mint'],
    border: variables['--color-border'],
  }
  const isRussian = input.locale === 'ru'
  const focusLabel = isRussian ? 'в фокусе' : 'is focusing'
  const heading = isRussian ? `${input.childName} собирает` : `${input.childName} collects`
  const catsLabel = isRussian ? 'котиков всего' : 'cats all time'
  const todayLabel = isRussian ? 'фокуса сегодня' : 'focus today'
  const weekLabel = isRussian ? 'за эту неделю' : 'this week'

  context.fillStyle = colors.cream
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  context.fillStyle = `${colors.mint}B5`
  context.beginPath()
  context.arc(945, 470, 300, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = `${colors.accent}20`
  context.beginPath()
  context.arc(-30, 1140, 130, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = colors.accent
  context.font = '850 42px ui-rounded, "SF Pro Rounded", system-ui, sans-serif'
  context.fillText('pomokitty', 76, 116)
  roundedRect(context, 718, 75, 286, 60, 30)
  context.fillStyle = `${colors.accent}1A`
  context.fill()
  context.fillStyle = colors.accent
  context.font = '800 21px ui-rounded, "SF Pro Rounded", system-ui, sans-serif'
  context.textAlign = 'center'
  context.fillText(`${input.childName} ${focusLabel}`, 861, 114)
  context.textAlign = 'left'

  context.fillStyle = colors.ink
  context.font = `850 ${input.childName.length > 12 ? 55 : 72}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`
  drawText(context, heading, 76, 243, 770, 82)
  context.fillStyle = colors.accent
  context.font = '850 72px ui-rounded, "SF Pro Rounded", system-ui, sans-serif'
  context.fillText(isRussian ? 'котиков 🐾' : 'cats 🐾', 76, 398)

  drawStatCard(context, 76, 475, `${input.todayMinutes} ${isRussian ? 'мин' : 'min'}`, todayLabel, colors)
  drawStatCard(context, 76, 659, `${input.weekMinutes} ${isRussian ? 'мин' : 'min'}`, weekLabel, colors)
  drawStatCard(context, 76, 843, String(input.cats), catsLabel, colors, true)

  try {
    const mascot = await loadCardMascot(input.theme)
    context.drawImage(mascot, 535, 515, 500, 500)
  } catch {
    context.fillStyle = colors.accent
    context.font = '180px system-ui, sans-serif'
    context.fillText('🐱', 665, 800)
  }

  roundedRect(context, 76, 1090, 928, 184, 28)
  context.fillStyle = colors.surface
  context.fill()
  context.lineWidth = 2
  context.strokeStyle = colors.border
  context.stroke()
  context.fillStyle = colors.ink
  context.font = '650 26px ui-rounded, "SF Pro Rounded", system-ui, sans-serif'
  drawText(context, isRussian
    ? 'Небольшие фокус-раунды помогают начинать и вовремя отдыхать.'
    : 'Small focus rounds help you start and take breaks on time.', 108, 1150, 810, 36)
  context.fillStyle = colors.accent
  context.font = '800 22px ui-rounded, "SF Pro Rounded", system-ui, sans-serif'
  context.fillText('pavelnasuta.github.io/pomokitty', 108, 1241)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not encode the share image.')), 'image/png')
  })
  return new File([blob], 'pomokitty-cats.png', { type: 'image/png' })
}

export async function saveStatsShareCard(file: File, text: string): Promise<void> {
  const url = URL.createObjectURL(file)
  const download = document.createElement('a')
  download.href = url
  download.download = file.name
  download.click()
  URL.revokeObjectURL(url)
  try {
    await navigator.clipboard?.writeText(text)
  } catch {
    // The image download is still useful when clipboard access is unavailable.
  }
}
