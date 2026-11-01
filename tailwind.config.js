/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B0F19',
          800: '#111827',
          700: '#1F2937',
        },
        charcoal: {
          900: '#131927',
          800: '#1A2234',
          700: '#242F46',
        },
        electric: {
          blue: '#3B82F6',
          cyan: '#06B6D4',
        },
        violet: {
          accent: '#8B5CF6',
        }
      }
    },
  },
  plugins: [],
}
