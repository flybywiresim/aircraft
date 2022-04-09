declare class AircraftData {
    imagePath: string;
    manufacturer: string;
    name: string;
    modelName: string;
    variationName: string;
    infos: DataValue[];
    index: number;
    aircraftId: number;
    variation: number;
    nbVariation: number;
    icon: string;
    type: string;
    fuel: RangeDataValue;
    tailNumber: string;
    callSign: string;
    flightNumber: string;
    appendHeavy: boolean;
    showTailNumber: boolean;
    wearAndTear: number;
    elevatorAuthority: number;
    aileronAuthority: number;
    rudderAuthority: number;
    _selected: boolean;
    autoValidate: boolean;
    displayVariationName: boolean;
    description: string;
    shortDescription: string;
    specs: TreeDataValue;
    moreInfoPath: string;
    selectedVariation: boolean;
    static getDebugValue(empty?: boolean): AircraftData;
}
declare class AircraftFilterData {
    name: string;
    ID: string;
    nb: number;
}
declare class AircraftSelectionData {
    selectedIndex: number;
    selectedType: string;
    typeFilters: AircraftFilterData[];
    rangeFilters: RangeDataValue[];
    selectedManufacturer: string;
    manufacturerFilters: AircraftFilterData[];
    planes: AircraftData[];
    variations: AircraftData[];
    current: AircraftData;
    static getFakeData(nbPlanes: number): AircraftSelectionData;
    static getDebugValue(): AircraftSelectionData;
}
declare class AircraftListener extends ViewListener.ViewListener {
    onAircraftListUpdated(callback: (data: AircraftSelectionData, recreate: boolean) => void): void;
    onSelectedPlaneUpdated(callback: (plane: AircraftData, index: number) => void): void;
    setSelectedPlane(index: number, variation: number, validate: boolean): void;
    setSelectedPlaneInHangar(index: number, variation: number): void;
    updatePlaneRangeFilter(value: number, id: number): void;
    onSetPlaneRangeFilters(callback: (rangeData: RangeDataValue[]) => void): void;
    requestPlaneList(): void;
}
declare function RegisterAircraftListener(callback?: any): AircraftListener;
