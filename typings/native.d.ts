// This object seems to be injected at runtime by Coherent. I could not find it in any base files.

declare global {
    class Facilities {
        static getMagVar(lat: Degrees, long: Degrees): Degrees;
    }
}

export {};
