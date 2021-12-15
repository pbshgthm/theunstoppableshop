colors = require('tailwindcss/colors')

module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      mono: ['Fira Code', 'system-ui'],
      sans: ['Inter', 'system-ui']
    }
  }
}