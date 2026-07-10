import { forwardRef } from 'react'
import type { LucideIcon, LucideProps } from 'lucide-react'

function Drop({ d }: { d: string }) {
  return <path d={d} fill="currentColor" stroke="none" />
}

/**
 * Лійка поливає рослини. Силует + великі краплі — читабельно навіть у 16–20px.
 */
export const WateringPlantsIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ color = 'currentColor', size = 24, strokeWidth = 2, className, ...props }, ref) => {
    const stroke = typeof strokeWidth === 'number' ? strokeWidth : Number(strokeWidth) || 2
    return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="1 2 22 19"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <g color={color}>
        {/* Лійка — заповнений силует, займає ~половину кадру */}
        <path
          fill="currentColor"
          stroke="none"
          d="M13.2 2.8 21.8 6.2 20.2 12.6 11.8 13.8 9.6 7.4 13.2 2.8z"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          d="M11.2 5.2c-1.6-2.8 2-4.4 4.4-3.1 1.8 1 2 3.2 1 4.5"
        />

        {/* Носик і розпилювач */}
        <path
          strokeWidth={stroke + 0.25}
          d="M9.8 9.2 3.6 11.2"
        />
        <path d="M3.6 11.2 2.2 12" />
        <path d="M3.6 11.2 3.2 13.2" />
        <path d="M3.6 11.2 5.2 12.4" />

        {/* Краплі — крупніші, менше штук */}
        <Drop d="M4.8 14.8c.35 1.35 1.2 2 0 3.4-.9-1.4-.7-2.05 0-3.4z" />
        <Drop d="M7.4 13.6c.35 1.35 1.2 2 0 3.4-.9-1.4-.7-2.05 0-3.4z" />
        <Drop d="M10.2 15.2c.35 1.35 1.2 2 0 3.4-.9-1.4-.7-2.05 0-3.4z" />
        <Drop d="M12.8 14c.3 1.15 1.05 1.7 0 2.9-.8-1.2-.6-1.75 0-2.9z" />

        {/* Ґрунт і рослини — компактно внизу */}
        <path d="M2.5 21.2c3.2-1.8 7-2.2 10.5-1.6s7 .5 10-1.4" />
        <path d="M7 20.6V18.2M6 19.4l1-1.2 1 1.2" />
        <path d="M12 20.2V16.4M10.2 18.4 12 16.4l1.8 2" />
        <path d="M17 20.6V18.4M16 19.5l1-1.1 1 1.1" />
      </g>
    </svg>
    )
  },
)

WateringPlantsIcon.displayName = 'WateringPlantsIcon'

export const WateringPlants = WateringPlantsIcon as LucideIcon
