import {nextui} from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
export default {
    content:  [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
    ],
    theme:    {
        extend: {
            animation: {
                wiggle: 'wiggle 1s ease-in-out infinite',
            },
            keyframes: {
                wiggle: {
                    '0%, 100%': {rotate: '-8deg'},
                    '50%':      {rotate: '8deg'},
                }
            }
        },
    },
    darkMode: "class",
    plugins:  [
        nextui({
            themes: {
                light: {
                    colors: {
                        primary:    {
                            DEFAULT:    "#EE333E",
                            foreground: "#fff",
                        },
                        secondary:  "#2b2b2b",
                        background: "#FFF",

                    }
                },
                dark:  {
                    colors: {
                        primary:    "#EE333E",
                        secondary:  "#eaeaea",
                        background: "#18181b",
                    }
                },
            }
        })
    ]
}