declare class UIWeatherData {
    index: number;
    name: string;
    icon: string;
    weatherImage: string;
    weatherImageLayered: string;
    visibility: string;
    live: boolean;
    locked: boolean;
    wind: string;
    displayed: boolean;
}
declare let UIWeatherConfig: UIWeatherConfigData;
declare abstract class UIWeatherConfigData {
    I_NUM_RULERS_FT: number;
    I_NUM_RULERS_M: number;
    I_MIN_CLOUD_HEIGHT_M: number;
    I_MIN_CLOUD_HEIGHT_FT: number;
    I_NAME_MAX_CHAR: number;
    I_ALTITUDE_LINE_CHUNK_ALTITUDE: number;
    I_MIN_WIND_LAYERS: number;
    I_MAX_WIND_LAYERS: number;
    F_MAX_WIND_SPEED: number;
    I_MIN_CLOUD_LAYERS: number;
    I_MAX_CLOUD_LAYERS: number;
    F_GUST_GRAPH_POINT_INTERVAL: number;
    F_GUST_GRAPH_MAX_SPEED: number;
    F_GUST_GRAPH_MAX_DISPLAYED_TIME: number;
    F_GUST_GRAPH_MAX_TOTAL_TIME: number;
    F_MIN_PRECIPITATION: number;
    F_MAX_PRECIPITATION: number;
    F_STEP_PRECIPITATION: number;
    F_MIN_LIGHTNING: number;
    F_MAX_LIGHTNING: number;
    F_STEP_LIGHTNING: number;
    F_MIN_GROUND_TEMP: number;
    F_MAX_GROUND_TEMP: number;
    F_STEP_GROUND_TEMP: number;
    F_MIN_GROUND_PRESS: number;
    F_MAX_GROUND_PRESS: number;
    F_STEP_GROUND_PRESS: number;
    F_MIN_ISA: number;
    F_MAX_ISA: number;
    F_STEP_ISA: number;
    F_MIN_AEROSOL_DENSITY: number;
    F_MAX_AEROSOL_DENSITY: number;
    F_STEP_AEROSOL_DENSITY: number;
    F_MIN_GROUND_SNOW: number;
    F_MAX_GROUND_SNOW: number;
    F_STEP_GROUND_SNOW: number;
}
declare let configJson: any;
declare class WeatherPresetData {
    __Type: string;
    index: number;
    sPresetName: string;
    bIsValid: boolean;
    bIsRemovable: boolean;
    tCloudLayers: CloudLayer[];
    tWindLayers: WindLayer[];
    oSettings: WeatherPresetSettingData;
    oConfig: WeatherPresetConfigData;
}
declare class WeatherPresetSettingData {
    bIsAltitudeAMGL: boolean;
    bIsInMeters: boolean;
    dvMSLPressure: RangeDataValue;
    dvMSLGLTemperature: RangeDataValue;
    dvPrecipitation: RangeDataValue;
    dvSnowCover: RangeDataValue;
    dvPollution: RangeDataValue;
    dvHumidityMultiplier: RangeDataValue;
    dvThunderstormRatio: RangeDataValue;
}
declare class WeatherPresetConfigData {
    dvMinAltitude: DataValue;
    dvMaxAltitude: DataValue;
    dvAltitudeLineChunk: DataValue;
    dvMinCloudHeight: DataValue;
    dvMaxWindSpeed: DataValue;
    fMaxGustSpeedRatio: number;
    fMinGustSpeedRatio: number;
}
declare class CloudLayer {
    __Type: string;
    dvDensityMultiplier: RangeDataValue;
    dvCoverageRatio: RangeDataValue;
    dvCloudScatteringRatio: RangeDataValue;
    dvAltitudeBot: RangeDataValue;
    dvAltitudeTop: RangeDataValue;
}
declare class WindLayer {
    __Type: string;
    dvAltitude: RangeDataValue;
    dvAngleRad: RangeDataValue;
    dvSpeed: RangeDataValue;
    gustWaveData: GustWave;
}
declare class GustWave {
    __Type: string;
    dvAngleRad: RangeDataValue;
    dvIntervalS: RangeDataValue;
    dvSpeedMultiplier: RangeDataValue;
}
declare class WeatherListener extends ViewListener.ViewListener {
    constructor(name: any);
    setZuluTime(timeSec: number): void;
    setLocalTime(timeSec: number): void;
    increaseZuluTime(): void;
    decreaseZuluTime(): void;
    increaseLocalTime(): void;
    decreaseLocalTime(): void;
    setForcedTime(value: boolean): void;
    timeLocalToSystemTime(): void;
    setDate(data: TimeData): void;
    onTimeUpdated(callback: (time: TimeData, locked: boolean) => void): void;
    onFlightTimeChanged(callback: (timeData: TimeData) => void): void;
    onToggleReadOnlyPanel(callback: (canEditWeather: boolean, canEditCustom: boolean) => void): void;
    updateGroundSnow(value: number): void;
    onUpdatedGroundSnow(callback: (value: number) => void): void;
    getWeatherPresetList(): void;
    setWeatherPresetList(callback: (m_w_preset_list: UIWeatherData[]) => void): void;
    setWeatherPreset(id: number): void;
    addPreset(name: string, successCallback: any, errorCallback: any): void;
    savePreset(preset: WeatherPresetData, successCallback: any, errorCallback: any): void;
    updatePreset(callback: (data: any) => void): void;
    updateTempWeatherPreset(preset: WeatherPresetData, successCallback: (data: WeatherPresetData) => void, errorCallback: any): void;
    removePreset(successCallback: any, errorCallback: any): void;
    onUpdateGustSpeedGraphData(callback: (data: number[]) => void): void;
    setUISelectedWindLayerIndex(value: number): void;
    onAllowEditGameflightFlag(callback: (value: boolean) => void): void;
}
declare function RegisterWeatherListener(callback?: any): WeatherListener;
