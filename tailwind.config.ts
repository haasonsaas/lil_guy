import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-up': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-up': 'fade-up 0.5s ease-out'
			},
			spacing: {
				'1': '0.25rem',    // 4px
				'2': '0.5rem',     // 8px
				'3': '0.75rem',    // 12px
				'4': '1rem',       // 16px
				'5': '1.25rem',    // 20px
				'6': '1.5rem',     // 24px
				'8': '2rem',       // 32px
				'10': '2.5rem',    // 40px
				'12': '3rem',      // 48px
				'16': '4rem',      // 64px
				'20': '5rem',      // 80px
				'24': '6rem',      // 96px
				'32': '8rem',      // 128px
				'40': '10rem',     // 160px
				'48': '12rem',     // 192px
				'56': '14rem',     // 224px
				'64': '16rem',     // 256px
			},
			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1.5' }],      // 12px
				'sm': ['0.875rem', { lineHeight: '1.5' }],     // 14px
				'base': ['1rem', { lineHeight: '1.5' }],       // 16px
				'lg': ['1.125rem', { lineHeight: '1.5' }],     // 18px
				'xl': ['1.25rem', { lineHeight: '1.5' }],      // 20px
				'2xl': ['1.5rem', { lineHeight: '1.4' }],      // 24px
				'3xl': ['1.875rem', { lineHeight: '1.3' }],    // 30px
				'4xl': ['2.25rem', { lineHeight: '1.2' }],     // 36px
				'5xl': ['3rem', { lineHeight: '1.1' }],        // 48px
				'6xl': ['3.75rem', { lineHeight: '1.1' }],     // 60px
				'7xl': ['4.5rem', { lineHeight: '1.1' }],      // 72px
				'8xl': ['6rem', { lineHeight: '1' }],          // 96px
				'9xl': ['8rem', { lineHeight: '1' }],          // 128px
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				serif: ['Playfair Display', 'serif'],
				display: ['Recursive', 'system-ui', 'sans-serif'],
			},
			typography: {
				DEFAULT: {
					css: {
						maxWidth: '65ch',
						color: 'hsl(var(--foreground))',
						lineHeight: '1.5',
						a: {
							color: 'hsl(var(--primary))',
							'&:hover': {
								color: 'hsl(var(--primary))/80',
							},
						},
						h1: {
							color: 'hsl(var(--foreground))',
							fontFamily: 'Playfair Display, serif',
							lineHeight: '1.2',
						},
						h2: {
							color: 'hsl(var(--foreground))',
							fontFamily: 'Playfair Display, serif',
							lineHeight: '1.3',
						},
						h3: {
							color: 'hsl(var(--foreground))',
							fontFamily: 'Playfair Display, serif',
							lineHeight: '1.4',
						},
						h4: {
							color: 'hsl(var(--foreground))',
							fontFamily: 'Playfair Display, serif',
							lineHeight: '1.4',
						},
						p: {
							lineHeight: '1.5',
						},
						code: {
							color: 'hsl(var(--foreground))',
							backgroundColor: 'hsl(var(--muted))',
							borderRadius: '0.25rem',
							paddingLeft: '0.25rem',
							paddingRight: '0.25rem',
							paddingTop: '0.125rem',
							paddingBottom: '0.125rem',
						},
						'pre code': {
							backgroundColor: 'transparent',
							borderWidth: '0',
							borderRadius: '0',
							padding: '0',
							fontWeight: '400',
							color: 'inherit',
							fontSize: 'inherit',
							fontFamily: 'inherit',
							lineHeight: 'inherit',
						},
						pre: {
							backgroundColor: 'hsl(var(--muted))',
							borderRadius: 'var(--radius)',
							padding: '1rem',
							borderWidth: '1px',
							borderColor: 'hsl(var(--border))',
						},
						blockquote: {
							color: 'hsl(var(--foreground))',
							borderLeftColor: 'hsl(var(--primary))/30',
						},
					}
				}
			}
		}
	},
	plugins: [animate, typography],
} satisfies Config;
