import { DisplayInterface } from '@fmgc/flightplanning/new/interface/DisplayInterface';
import { EventBus, Subscription } from '@microsoft/msfs-sdk';
import { FlightManagementComputer } from 'instruments/src/MFD/FMC/FlightManagementComputer';
import { FmcInterface, FmcOperatingModes } from 'instruments/src/MFD/FMC/FmcInterface';
import { FmcIndex, FmcServiceInterface } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { MfdDisplayInterface } from 'instruments/src/MFD/MFD';

/*
 * Handles navigation (and potentially other aspects) for MFD pages
 */
export class FmcService implements FmcServiceInterface {
    protected subs = [] as Subscription[];

    protected fmc: FmcInterface[] = [];

    constructor(private bus: EventBus, mfdReference: (DisplayInterface & MfdDisplayInterface) | null) {
        this.createFmc(mfdReference);
    }

    get master() {
        return this.fmc.find((it) => (it.operatingMode === FmcOperatingModes.Master)) ?? null;
    }

    get slave() {
        return this.fmc.find((it) => (it.operatingMode === FmcOperatingModes.Slave)) ?? null;
    }

    get standby() {
        return this.fmc.find((it) => (it.operatingMode === FmcOperatingModes.Standby)) ?? null;
    }

    createFmc(mfdReference: (DisplayInterface & MfdDisplayInterface) | null): void {
        // Only instantiate FMC-A for now, this takes up enough resources already
        // Before more FMC can be added, they have to be synced
        this.fmc.push(new FlightManagementComputer(FmcIndex.FmcA, FmcOperatingModes.Master, this.bus, mfdReference));
        this.fmc[FmcIndex.FmcA].operatingMode = FmcOperatingModes.Master;
    }

    has(forFmcIndex: FmcIndex) {
        return this.fmc[forFmcIndex] !== undefined;
    }

    get(forFmcIndex: FmcIndex) {
        return this.fmc[forFmcIndex];
    }

    setMfdReference(forFmcIndex: FmcIndex, mfd: DisplayInterface & MfdDisplayInterface) {
        if (this.fmc[forFmcIndex] === undefined) {
            return;
        }

        this.fmc[forFmcIndex].mfdReference = mfd;
    }
}
