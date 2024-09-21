import { Instrument } from '@microsoft/msfs-sdk';

/**
 * This is needed to initialize the desired fuel L:Var on load to sync with the fuel quantity as per the fuel state management per ATC ID
 * This is a temporary solution until all fuel state related ops are contained in the same module.
 */
export class LegacyFuelInit implements Instrument {
  init() {
    const fuelWeight = SimVar.GetSimVarValue('FUEL TOTAL QUANTITY WEIGHT', 'kilograms');
    SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', fuelWeight);
  }

  public onUpdate(): void {
    // noop
  }
}
