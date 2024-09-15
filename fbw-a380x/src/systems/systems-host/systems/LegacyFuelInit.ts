export class LegacyFuelInit {
  init() {
    const fuelWeight = SimVar.GetSimVarValue('FUEL TOTAL QUANTITY WEIGHT', 'kilograms');
    SimVar.SetSimVarValue('L:A32NX_FUEL_DESIRED', 'kilograms', fuelWeight);
  }
}
