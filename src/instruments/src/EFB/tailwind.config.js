/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

module.exports = {
    purge: ['./**/*.{js,jsx,ts,tsx}', 'a.html'],
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            height: () => ({
                120: '30rem',
                144: '36rem',
                160: '40rem',
                map: '40.3rem',
            }),
            keyframes: {
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-1deg)' },
                    '50%': { transform: 'rotate(2.5deg)' },
                },
            },
            animation: {
                wiggle: 'wiggle 15s ease-in-out infinite',
            },
            backgroundColor: ['active'],
            textColor: ['active'],
            colors: {
                blue: {
                    'DEFAULT': '#6399AE',
                    'light': '#00C2CB',
                    'light-contrast': '#009da6',
                    'medium': '#006166',
                    'medium-contrast': '#1f2937',
                    'dark': '#1B2434',
                    'darker': '#141E30',
                },
                gray: {
                    medium: '#797979',
                },
            },
            boxShadow: {
                'md-dark': '1px 1px 7px 1px rgba(0, 0, 0, 0.2)',
                'md-dark-contrast': '1px 1px 7px 1px rgba(0, 0, 0, 0.35)',
                'lg-dark': '1px 1px 10px 1px rgba(0, 0, 0, 0.15)',
                '2xl-light': '0 0 50px -20px rgba(255, 255, 255, 0.15)',
            },
        },
    },
    variants: {
        extend: {
            display: ['last'],
            margin: ['last'],
        },
    },
    plugins: [],
};
