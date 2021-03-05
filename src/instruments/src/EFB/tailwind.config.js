module.exports = {
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            height: () => ({
                'efb': '52.5rem',
            }),
            colors: {
                blue: {
                    'efb-dark': '#252F41',
                    'efb-darker': '#1B2434'
                }
            }
        }
    },
    variants: {
        extend: {},
    },
    plugins: [require('@flybywiresim/tailwind-config')],
};
