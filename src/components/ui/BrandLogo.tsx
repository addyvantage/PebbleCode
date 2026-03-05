import pebbleWordmarkLight from '../../assets/brand/pebblecode-wordmark-light.png'
import pebbleWordmarkDark from '../../assets/brand/pebblecode-wordmark-dark.png'
import { useTheme } from '../../hooks/useTheme'

interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  return (
    <div className="flex items-center leading-none">
      <img
        src={isDarkMode ? pebbleWordmarkDark : pebbleWordmarkLight}
        alt="PebbleCode"
        draggable={false}
        className={className ?? 'h-8 w-auto select-none pointer-events-none object-contain'}
      />
    </div>
  )
}
