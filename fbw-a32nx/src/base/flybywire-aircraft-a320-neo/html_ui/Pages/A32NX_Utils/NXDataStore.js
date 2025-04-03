Include.addScript("/JS/dataStorage.js");

// FIXME delete. Last user is fbw-a32nx\src\base\flybywire-aircraft-a320-neo\html_ui\Pages\VLivery\Liveries\A32NX_Registration\Registration.js
class NXDataStore {
    /* private */ static get listener() {
        if (NXDataStore._listener === undefined) {
            NXDataStore._listener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);
        }
        return NXDataStore._listener;
    }

    static get(key, defaultVal) {
        const val = GetStoredData(`A32NX_${key}`);
        if (!val) {
            return defaultVal;
        }
        return val;
    }

    static set(key, val) {
        SetStoredData(`A32NX_${key}`, val);
        this.listener.triggerToAllSubscribers('FBW_NXDATASTORE_UPDATE', key, val);
    }

    static subscribe(key, callback) {
        return Coherent.on('FBW_NXDATASTORE_UPDATE', (updatedKey, value) => {
            if (key === '*' || key === updatedKey) {
                callback(updatedKey, value);
            }
        }).clear;
    }

    static getAndSubscribe(key, callback, defaultVal) {
        callback(key, NXDataStore.get(key, defaultVal));
        return NXDataStore.subscribe(key, callback);
    }
}
