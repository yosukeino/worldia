import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        skylines: {
          bg: '#0b1528',
          panel: '#112240',
          border: '#1e3a6e',
          cyan: '#00b4d8',
          teal: '#00f5d4',
          amber: '#ffb703',
        },
      },
    },
  },
  plugins: [],
};

export default config;
