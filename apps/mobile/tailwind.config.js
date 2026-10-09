/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        field: "#0E3B2E",      // deep turf green
        turf: "#1F7A4D",
        lime: "#B7F26B",       // accent
        chalk: "#F5F4EE",      // off-white
        ink: "#111614",
        clay: "#E6572E",       // warning / flame
        sky: "#5BB6F2",
      },
      fontFamily: { display: ["System"], body: ["System"] },
    },
  },
  plugins: [],
};
