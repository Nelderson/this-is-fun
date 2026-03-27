/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
      extend: {
        colors: {
          black_card: "#1a1a2e",
          white_card: "#f5f5f5",
          accent: "#e94560",
          bg: "#0f0f23",
          surface: "#16213e",
        },
      },
    },
    plugins: [],
  };