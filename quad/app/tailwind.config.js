/** @type {import('tailwindcss').Config} */
// BMW M design system (DESIGN.md) → Quad. True-black canvas, white machined type,
// 0px radius by default, M tricolor as the only brand accent.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // Replace the radius scale to lock the system: "almost always 0, sometimes circular".
    borderRadius: { none: "0", DEFAULT: "0", sm: "2px", full: "9999px" },
    extend: {
      colors: {
        canvas: "#000000",
        surface: { DEFAULT: "#1a1a1a", soft: "#0d0d0d", elevated: "#262626", carbon: "#2b2b2b" },
        ink: "#ffffff",
        body: { DEFAULT: "#bbbbbb", strong: "#e6e6e6" },
        muted: "#7e7e7e",
        hairline: { DEFAULT: "#3c3c3c", strong: "#262626" },
        m: { bluelight: "#0066b1", blue: "#1c69d4", red: "#e22718" },
        success: "#0fa336",
        warning: "#f4b400",
      },
      fontFamily: {
        display: ['"Saira Condensed"', "Saira", "sans-serif"],
        body: ['"Saira"', "system-ui", "sans-serif"],
      },
      letterSpacing: { machined: "0.14em", wide2: "0.06em" },
      maxWidth: { device: "460px" },
      keyframes: {
        "stripe-in": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        "rise": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "pulse-red": { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.45" } },
      },
      animation: {
        "stripe-in": "stripe-in .5s cubic-bezier(.2,.7,.2,1) forwards",
        "rise": "rise .45s cubic-bezier(.2,.7,.2,1) forwards",
        "pulse-red": "pulse-red 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
