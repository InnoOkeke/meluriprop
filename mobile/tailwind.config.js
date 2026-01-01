/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#2563EB', // blue-600
                },
                secondary: {
                    DEFAULT: '#0EA5E9', // sky-500
                },
                accent: {
                    DEFAULT: '#FACC15', // yellow-400
                },
                dark: '#0F172A',
                success: '#22C55E',
                error: '#EF4444',
            },
        },
    },
    plugins: [],
}
