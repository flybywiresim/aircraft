import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { GameStateProvider, Wait } from '@microsoft/msfs-sdk';
import { NearestSearchType } from '../../../navdata/client/backends/Msfs/FsTypes';

export class BaroUnitSelector {
  private static readonly IN_HG_REGIONS = ['K', 'C', 'M', 'P', 'RJ', 'RO', 'TI', 'TJ'];

  private facilityListener?: ViewListener.ViewListener;

  constructor(private readonly setBaroSelector: (isHpa: boolean) => void) {}

  public performSelection(): void {
    const configInitBaroUnit = NXDataStore.get('CONFIG_INIT_BARO_UNIT', 'AUTO');
    if (configInitBaroUnit !== 'AUTO') {
      this.setBaroSelector(configInitBaroUnit == 'HPA');
    } else if (this.facilityListener) {
      this.autoSetBaroUnit();
    } else {
      RegisterViewListener('JS_LISTENER_FACILITY', () => this.autoSetBaroUnit(), true);
    }
  }

  /** @private */
  private async autoSetBaroUnit() {
    await Wait.awaitSubscribable(GameStateProvider.get(), (v) => v === GameState.ingame, true);

    const sessionId = await Coherent.call('START_NEAREST_SEARCH_SESSION', NearestSearchType.Airport);
    const handler = Coherent.on('NearestSearchCompleted', (result: { sessionId: number; added: string[] }) => {
      if (result.sessionId === sessionId) {
        handler.clear();

        const useInHg =
          result.added.length > 0 &&
          (BaroUnitSelector.IN_HG_REGIONS.includes(result.added[0].charAt(7)) ||
            BaroUnitSelector.IN_HG_REGIONS.includes(result.added[0].substring(7, 9)));

        this.setBaroSelector(!useInHg);
      }
    });

    const lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
    const lon = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

    Coherent.call('SEARCH_NEAREST', sessionId, lat, lon, 50000, 1);
  }
}
