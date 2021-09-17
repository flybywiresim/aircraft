export const secondsToUTC = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds - h * 3600) / 60);
    return (h % 24).toFixed(0).padStart(2, '0') + m.toFixed(0).padStart(2, '0');
};

export const secondsTohhmm = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds - h * 3600) / 60);
    return h.toFixed(0).padStart(2, '0') + m.toFixed(0).padStart(2, '0');
};
