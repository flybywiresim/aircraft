interface IBingMapsParams {
    lla?: LatLong | LatLongAlt;
    radius?: number;
    topViewZoom?: number;
}
interface IBingMapsRoad {
    lod: number;
    id: number;
    type: number;
    path: LatLong[];
}
interface IBingMapsTopView {
    altitudeMin: number;
    altitudeMax: number;
    zoomLevels: number;
}
declare enum EBingMode {
    CURSOR = "Cursor",
    PLANE = "Plane",
    VFR = "Vfr",
    HORIZON = "Horizon",
    TOPVIEW = "Topview"
}
declare enum EBingReference {
    SEA = "Sea",
    PLANE = "Plane",
    AERIAL = "Aerial"
}
declare enum EWeatherRadar {
    OFF = "Off",
    TOPVIEW = "Topview",
    HORIZONTAL = "Horizontal",
    VERTICAL = "Vertical"
}
declare enum BingMapsFlags {
    FL_BINGMAP_REF_PLANE = 1,
    FL_BINGMAP_REF_AERIAL = 2,
    FL_BINGMAP_3D = 4,
    FL_BINGMAP_3D_TOPVIEW = 8
}
declare class BingMapsConfig {
    resolution: number;
    heightColors: number[];
    clearColor: number;
}
declare class BingMapsBinder {
    friendlyName: string;
}
declare class BingMapElement extends HTMLElement {
    onRoadAddedCallback: (road: IBingMapsRoad[]) => void;
    private static nullLatLong;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    private onListenerRegistered;
    private onListenerBinded;
    isReady(): boolean;
    setBingId(_id: string): void;
    setMode(_mode: EBingMode): void;
    setReference(_ref: EBingReference): void;
    setAspectRatio(_ratio: number): void;
    getAspectRatio(): number;
    addConfig(_config: BingMapsConfig): void;
    setConfig(_configId: number): void;
    setParams(_value: IBingMapsParams): void;
    setTopView(_value: IBingMapsTopView): void;
    showIsolines(_show: boolean): void;
    getIsolines(): boolean;
    showWeather(_mode: EWeatherRadar, _cone: number): void;
    getWeather(): EWeatherRadar;
    setVisible(_show: boolean): void;
    private updateMapImage;
    is3D(): boolean;
    private getFlags;
    private updateBinding;
    private updateConfig;
    private updateParams;
    private updateTopView;
    private updateVisibility;
    private updateIsolines;
    private updateWeather;
    protected OnDestroy: () => void;
    private m_params;
    private m_topView;
    private m_configs;
    private m_configId;
    private m_bingRef;
    private m_bingMode;
    private m_bingId;
    private m_showIsolines;
    private m_showWeather;
    private m_weatherCone;
    private m_isVisible;
    private m_aspectRatio;
    private m_imgElement;
    private m_listener;
    private m_listenerRegistered;
    private m_listenerBinded;
    private m_listenerUId;
    private m_mapImageName;
    get topView(): IBingMapsTopView;
}
