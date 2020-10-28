Include.addScript("/JS/dataStorage.js");

class NXDataStore {
    static get(key, defaultVal) {
        let val = NXDataStore.get(`A32NX_${key}`);
        if (!val) {
            return defaultVal;
        }
        return val;
    }

    static set(key, val) {
        NXDataStore.set(`A32NX_${key}`, val);
    }
}