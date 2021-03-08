module.exports = {
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            height: () => ({
                'efb': '50rem',
            }),
        }
    },
    variants: {
        extend: {},
    },
    plugins: [require('@flybywiresim/tailwind-config')],
};
