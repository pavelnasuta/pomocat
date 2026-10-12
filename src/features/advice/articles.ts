import startCat from '../../assets/advice/start.png'
import smallStepsCat from '../../assets/advice/small-steps.png'
import breaksCat from '../../assets/advice/breaks.png'
import distractionsCat from '../../assets/advice/distractions.png'
import motivationCat from '../../assets/advice/motivation.png'

export const articleIds = ['start', 'smallSteps', 'breaks', 'distractions', 'motivation'] as const

export type AdviceArticleId = (typeof articleIds)[number]

export const articleImages: Record<AdviceArticleId, string> = {
  start: startCat,
  smallSteps: smallStepsCat,
  breaks: breaksCat,
  distractions: distractionsCat,
  motivation: motivationCat,
}
