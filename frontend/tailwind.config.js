/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#FF4785", // Example K-Pop pink?
                secondary: "#2A2A2A",
            },
        },
    },
    plugins: [],
}
