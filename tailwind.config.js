/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		colors: {
  			pebble: {
  				deep: 'rgb(var(--pebble-deep) / <alpha-value>)',
  				secondary: 'rgb(var(--pebble-secondary) / <alpha-value>)',
  				panel: 'rgb(var(--pebble-panel) / <alpha-value>)',
  				canvas: 'rgb(var(--pebble-canvas) / <alpha-value>)',
  				border: 'rgb(var(--pebble-border) / <alpha-value>)',
  				overlay: 'rgb(var(--pebble-overlay) / <alpha-value>)',
  				accent: 'rgb(var(--pebble-accent) / <alpha-value>)',
  				success: '#10B981',
  				warning: '#F59E0B',
  				'text-primary': 'rgb(var(--pebble-text-primary) / <alpha-value>)',
  				'text-secondary': 'rgb(var(--pebble-text-secondary) / <alpha-value>)',
  				'text-muted': 'rgb(var(--pebble-text-muted) / <alpha-value>)',
  				'chip-surface': 'rgb(var(--pebble-chip-surface) / <alpha-value>)'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		boxShadow: {
  			glass: 'var(--pebble-shadow)'
  		},
  		fontFamily: {
  			sans: [
				'Space Grotesk',
  				'ui-sans-serif',
  				'sans-serif'
  			],
  			mono: [
				'JetBrains Mono',
  				'ui-monospace',
  				'monospace'
  			]
  		},
  		animation: {
  			shimmer: 'shimmer var(--shimmer-duration, 2.6s) linear infinite',
  			fadeInScale: 'fadeInScale 180ms ease-out'
  		},
  		keyframes: {
  			shimmer: {
  				from: {
  					backgroundPosition: '200% center, center'
  				},
  				to: {
  					backgroundPosition: '-200% center, center'
  				}
  			},
  			fadeInScale: {
  				from: {
  					opacity: '0',
  					transform: 'scale(0.97)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
