const pad = (n: number) => String(n).padStart(2, '0')

export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayStr = () => toDateStr(new Date())
export const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number) => {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}
export const mondayOf = (s: string) => {
  const d = parseDate(s)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toDateStr(d)
}
export const daysBetween = (a: string, b: string) =>
  Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000)

/** Program week number (1-based) for a date; <=0 means the program has not started. */
export const weekOf = (startDate: string, date: string) =>
  Math.floor(daysBetween(mondayOf(startDate), date) / 7) + 1
export const weekStartOf = (startDate: string, week: number) => addDays(mondayOf(startDate), (week - 1) * 7)

export const isoToDateStr = (iso: string) => toDateStr(new Date(iso))

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const fmtShort = (s: string) => {
  const d = parseDate(s)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}
export const fmtDay = (s: string) => `${DOW[parseDate(s).getDay()]} ${fmtShort(s)}`
