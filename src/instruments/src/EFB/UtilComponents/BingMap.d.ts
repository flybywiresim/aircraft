declare class BingMapConfig {}

declare class NetBingMap extends HTMLElement {
    m_configs: BingMapConfig[];

    m_configId: number;

    m_params: Record<string, unknown>;
    addConfig(config: BingMapConfig): void;
    setConfig(id: number): void;
    setParams(params: Record<string, unknown>);
    setBingId(id: string): void;
    setVisible(visible: boolean): void;
}

declare class SvgMapConfig {
    generateBingMap(bingMap: NetBingMap): void;
    load(path: string, callback): BingMapConfig;
}

declare class LatLongAlt {
    lat: number;

    long: number;
    constructor(lat: number, long: number);
}
