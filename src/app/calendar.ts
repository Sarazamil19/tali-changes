// Today's date in words. The demo is frozen on Monday 23 November 2026 to match the sample data;
// real accounts use the real date.
import { cloudEnabled } from './cloud'
import { t } from './i18n'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const today = () => (cloudEnabled ? new Date() : new Date(2026, 10, 23, 12, 52))

/** "November" (translated) */
export const monthName = (offset = 0) => {
  const d = today()
  return t(MONTHS[(d.getMonth() + offset + 12) % 12])
}
/** "Monday 23 November" */
export const fullDate = () => {
  const d = today()
  return `${t(DAYS[d.getDay()])} ${d.getDate()} ${t(MONTHS[d.getMonth()])}`
}
/** "1–23 November 2026" — month to date */
export const monthToDate = () => {
  const d = today()
  return `1–${d.getDate()} ${t(MONTHS[d.getMonth()])} ${d.getFullYear()}`
}
/** days left in the month, today included */
export const daysLeftInMonth = () => {
  const d = today()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate() + 1
}
