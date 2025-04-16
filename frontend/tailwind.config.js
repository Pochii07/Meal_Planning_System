/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js", // Add this line
    "./node_modules/flowbite-react/**/*.{js,jsx}" // Add this line
  ],
  theme: {
    extend: {
      fontFamily: {
        worksans: ['Work Sans', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('flowbite/plugin') // Add this line
  ],
}