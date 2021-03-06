module.exports = {
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            height: () => ({
                'efb': '52.5rem',
            }),
        }
    },
    variants: {
        extend: {},
    },
    plugins: [require('@flybywiresim/tailwind-config')],
};
