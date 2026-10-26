import type { ReactNode } from 'react'

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}
const I = (children: ReactNode, size?: number) => (
  <svg {...base} {...(size ? { width: size, height: size } : {})}>
    {children}
  </svg>
)

export const IconHome = () => I(<><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /></>)
export const IconPlan = () => I(<><path d="M5 7h14M5 12h14M5 17h9" /></>)
export const IconPulse = () => I(<path d="M3 12h4l2.5-6 4 12 2.5-6H21" />)
export const IconChart = () => I(<><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 15l4-4 3 3 5-6" /></>)
export const IconCalendar = () => I(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>)
export const IconGear = () => I(<><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" /></>)
export const IconCheck = ({ size = 20 }: { size?: number }) => I(<path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth={2.4} />, size)
export const IconChevronLeft = () => I(<path d="M15 5l-7 7 7 7" />, 20)
export const IconChevronRight = () => I(<path d="M9 5l7 7-7 7" />, 18)
export const IconChevronDown = ({ open }: { open?: boolean }) =>
  I(<path d={open ? 'M6 14l6-6 6 6' : 'M6 10l6 6 6-6'} />, 18)
export const IconArrow = () => I(<path d="M5 12h14M13 6l6 6-6 6" />, 20)
export const IconPlus = () => I(<path d="M12 5v14M5 12h14" />, 16)
export const IconMinus = () => I(<path d="M5 12h14" />, 16)
export const IconClose = () => I(<path d="M6 6l12 12M18 6L6 18" />, 16)
export const IconEdit = () => I(<><path d="M4 20h4L19 9l-4-4L4 16v4z" /></>, 18)
