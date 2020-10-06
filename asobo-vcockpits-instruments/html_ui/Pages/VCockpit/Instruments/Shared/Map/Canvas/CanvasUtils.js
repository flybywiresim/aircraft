class CanvasUtils {
    static BlurCanvas(canvas, w, h, range = 1) {
        const context = canvas.getContext("2d");
        const data = context.getImageData(0, 0, w, h);
        const l = data.data.length / 4;
        for (let i = 0; i < l; i++) {
            const pi = i % w;
            const pj = Math.floor(i / w);
            let r = data.data[4 * i];
            let g = data.data[4 * i + 1];
            let b = data.data[4 * i + 2];
            let a = data.data[4 * i + 3];
            let n = 1;
            for (let ii = Math.max(0, pi - range); ii <= pi + range && ii < w; ii++) {
                for (let jj = Math.max(0, pj - range); jj <= pj + range && jj < h; jj++) {
                    if (ii !== pi || jj != pj) {
                        const rr = data.data[4 * (ii + w * jj)];
                        const gg = data.data[4 * (ii + w * jj) + 1];
                        const bb = data.data[4 * (ii + w * jj) + 2];
                        const aa = data.data[4 * (ii + w * jj) + 3];
                        r = Math.floor((r * n + rr) / (n + 1));
                        g = Math.floor((g * n + gg) / (n + 1));
                        b = Math.floor((b * n + bb) / (n + 1));
                        a = Math.floor((a * n + aa) / (n + 1));
                        n = n + 1;
                    }
                }
            }
            data.data[4 * i] = r;
            data.data[4 * i + 1] = g;
            data.data[4 * i + 2] = b;
            data.data[4 * i + 3] = a;
        }
        context.putImageData(data, 0, 0);
    }
    static AlphaThresholdCanvas(canvas, w, h, threshold = 127) {
        const context = canvas.getContext("2d");
        const data = context.getImageData(0, 0, w, h);
        const l = data.data.length / 4;
        for (let i = 0; i < l; i++) {
            const a = data.data[4 * i + 3];
            data.data[4 * i + 3] = a > threshold ? 255 : 0;
        }
        context.putImageData(data, 0, 0);
    }
}
//# sourceMappingURL=CanvasUtils.js.map