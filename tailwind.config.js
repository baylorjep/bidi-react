/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {},
  },
  corePlugins: {
    preflight: false, // This prevents Tailwind from resetting Bootstrap's styles
  },
  prefix: 'tw-', // This adds a prefix to all Tailwind classes to avoid conflicts
  important: false, // Let Bootstrap maintain its specificity
  plugins: [],
}