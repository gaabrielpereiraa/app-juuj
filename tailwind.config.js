/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#f47b25',
        background: {
          light: '#fff8dc',
        },
        text: {
          light: '#5d4037',
          secondary: '#9E6B47',
        },
        card: {
          light: '#fffcf4',
        },
        button: {
          light: '#FFAC81',
        },
        green: {
          500: '#50B87A',
        },
      },
      fontFamily: {
        'roboto-condensed': ['Roboto Condensed', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'condensed': ['Roboto Condensed', 'sans-serif'],
        'display': ['Quicksand', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1.5rem',
        '2xl': '2rem',
        '3xl': '3rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'soft': '0 4px 10px rgba(0, 0, 0, 0.05)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'none': 'none',
        'black-xl': '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
        'brand': `0 20px 25px -5px rgb(241 4 32 / 0.1), 0 8px 10px -6px rgb(241 4 32 / 0.1)`,
      },
    },
  },
  plugins: [],
}