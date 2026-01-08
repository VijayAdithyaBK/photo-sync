/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cream: '#F9F5F1',
                'retro-red': '#C84C4C',
                'retro-green': '#4F7859',
                'retro-dark': '#2D2D2D',
                'retro-border': '#2D2D2D',
                'retro-bg': '#E5E0DA',
            },
            fontFamily: {
                sans: ['"DM Sans"', 'sans-serif'],
                serif: ['"DM Serif Display"', 'serif'],
            },
            boxShadow: {
                'retro': '4px 4px 0px 0px #2D2D2D',
                'retro-hover': '6px 6px 0px 0px #2D2D2D',
                'retro-sm': '2px 2px 0px 0px #2D2D2D',
            }
        },
    },
    plugins: [],
}
