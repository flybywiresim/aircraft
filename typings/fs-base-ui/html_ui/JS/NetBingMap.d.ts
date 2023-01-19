declare global {
    interface Document {
        createElement(tagName: "bing-map"): BingMapElement;
    }

    class BingMapsConfig {
    }

    enum EBingMode {
        CURSOR = "Cursor",
        PLANE = "Plane",
        VFR = "Vfr",
        HORIZON = "Horizon"
    }

    enum EBingReference {
        SEA = "Sea",
        PLANE = "Plane"
    }

    enum EWeatherRadar {
        OFF = "Off",
        TOPVIEW = "Topview",
        HORIZONTAL = "Horizontal",
        VERTICAL = "Vertical"
    }

    class BingMapsBinder {}

    class BingMapConfig {}

    class BingMapElement extends HTMLElement {
        m_configs: BingMapConfig[];
        m_configId: number;
        m_params: Record<string, unknown>;
        onListenerRegistered: () => void;
        onListenerBinded: (binder: { friendlyName: any; is3D: boolean }, uid: any) => void;
        updateMapImage: (uid: any, img: string) => void;
        OnDestroy: () => void;
        connectedCallback(): void;
        disconnectedCallback(): void;
        isReady(): boolean;
        setBingId(id: any): void;
        setMode(mode: EBingMode): void;
        setReference(ref: EBingReference): void;
        addConfig(config: BingMapsConfig): void;
        setConfig(configId: number): void;
        setParams(value: any): void;
        showIsolines(show: any): void;
        getIsolines(): any;
        showWeather(mode: any, cone: any): void;
        getWeather(): any;
        setVisible(show: any): void;
        is3D(): boolean;
        updateBinding(): void;
        updateConfig(): void;
        updateReference(): void;
        updatePosAndSize(): void;
        updateVisibility(): void;
        updateIsolines(): void;
        updateWeather(): void;
    }

    class SvgMapConfig {
        generateBingMap(bingMap: NetBingMap): void;
        load(path: string, callback): BingMapConfig;
    }

    class LatLongAlt {
        lat: number;
        long: number;
        constructor(lat: number, long: number);
    }
}

export {};
