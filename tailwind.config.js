import {heroui} from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {},
    },
    darkMode: "class",
    plugins: [heroui({
        themes: {
            light: {
                colors: {
                    primary: {
                        DEFAULT: "#f13848",
                        foreground: "#fff",
                        100: "#fce4e6",
                        200: "#f9b3b9",
                        300: "#f6828a",
                        400: "#f3505c",
                        500: "#f13848",
                        600: "#e61f2f",
                        700: "#b01723",
                        800: "#7f0e18",
                        900: "#4c070e",
                    },
                    secondary: {
                        DEFAULT: "#3a82f6",
                        foreground: "#fff",
                        100: "#e4f0fe",
                        200: "#b3d1fd",
                        300: "#82b1fb",
                        400: "#508ff9",
                        500: "#3a82f6",
                        600: "#2366e3",
                        700: "#184ab0",
                        800: "#0e2e7f",
                        900: "#07194c",
                    },
                    background: "#e3e3ea",

                }
            },
        }
    })]
}