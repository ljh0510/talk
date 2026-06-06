/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // supports dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kakao: {
          yellow: '#FEE500',
          brown: '#3C1E1E',
          label: '#191919',
          bg: '#FAFAFA',
          sidebar: '#F2F2F2',
          chatBg: '#BACEE0',
          hover: '#EAEAEA',
          accent: '#4A3030',
        }
      }
    },
  },
  plugins: [],
}
