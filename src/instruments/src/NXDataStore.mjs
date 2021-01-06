Include.addScript('/JS/dataStorage.js');

export default class NXDataStore {
    static get(key, defaultVal) {
        const val = GetStoredData(`A32NX_${key}`);
        if (!val) {
            return defaultVal;
        }
        return val;
    }

    static set(key, val) {
        SetStoredData(`A32NX_${key}`, val);
    }
}
