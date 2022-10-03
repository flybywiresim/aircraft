declare class PayloadValue extends RangeDataValue {
    __Type: string;
    pos: Vec3;
}
declare class ContactPoint {
    pos: Vec3;
    type: number;
}
declare class FuelPayloadData {
    planeManufacturer: string;
    planeModel: string;
    planeImage: string;
    stations: PayloadValue[];
    totalPayload: RangeDataValue;
    fuelTanks: PayloadValue[];
    totalFuelVolume: RangeDataValue;
    totalFuelWeight: RangeDataValue;
    emptyWeight: RangeDataValue;
    totalWeight: RangeDataValue;
    displayFuelAsWeight: boolean;
    volumeUnit: string;
    weightUnit: string;
    consumptionInfos: DataValue[];
    static getFakeData(nbFuelTanks: number, nbPayloadStations: number): FuelPayloadData;
}
declare class BalanceData {
    balancePercent: RangeDataValue;
    balancePosition: Vec3;
    balance: RangeDataValue;
    LEMAC: number;
    TEMAC: number;
    image: string;
    emptyCGPosition: RangeDataValue;
}
declare class ShapeData {
    planeImage: string;
    datumPosition: Vec3;
    contactPoints: ContactPoint[];
    fuselage_length: number;
    fuselage_diameter_max: number;
    fuselage_height_max: number;
    fuselage_forebody_length: number;
    fuselage_afterbody_length: number;
    fuselage_midbody_length: number;
    fuelPayload: FuelPayloadData;
    balance: BalanceData;
}
declare class FuelPayloadListener extends ViewListener.ViewListener {
    constructor(name: string);
    onFuelPayloadDataUpdated(callback: any): void;
    onBalanceDataUpdated(callback: any): void;
    onShapeDataUpdated(callback: any): void;
    setEmptyCOG(value: any): void;
    resetFuelPayload(): void;
}
declare function RegisterFuelPayloadListener(callback?: any): FuelPayloadListener;
