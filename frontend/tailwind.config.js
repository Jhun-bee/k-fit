/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#FF2D78", // K-Fit Accent Pink
                secondary: "#000000",
                background: "#FFFFFF",
                surface: "#F5F5F5",
            },
            fontFamily: {
                sans: ["Pretendard", "Inter", "sans-serif"],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'aurora': 'aurora 4s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                aurora: {
                    '0%, 100%': { opacity: '0.4', transform: 'scale(1) rotate(0deg)' },
                    '50%': { opacity: '0.8', transform: 'scale(1.2) rotate(3deg)' },
                }
            }
        },
    },
    plugins: [],
}
