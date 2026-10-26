export type Lang = 'en' | 'es'

export const detectLang = (): Lang => {
  try {
    return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
  } catch {
    return 'en'
  }
}
