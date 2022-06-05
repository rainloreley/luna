module.exports = {
  content: [
    './renderer/pages/**/*.{js,ts,jsx,tsx}',
    './renderer/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    darkMode: 'media', // or 'media' or 'class'
    backgroundColor: (theme) => ({
      ...theme('colors'),
      'dark-primary': '#0f0f0f',
      'dark-secondary': '#1c1c1c',
      'dark-tertiary': '#212121',
    }),
    extend: {},
  },
  plugins: [],
};
