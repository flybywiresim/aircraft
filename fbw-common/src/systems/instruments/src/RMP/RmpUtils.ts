import { SimVarValueType } from '@microsoft/msfs-sdk';
import { VhfComIndices } from '../../../shared/src/RadioTypes';
import { RegisteredSimVar } from '../../../shared/src/SimVarUtils';

export class RmpUtils {
  private static activeFrequencyCache = new Map<VhfComIndices, RegisteredSimVar<number>>();
  private static activeModeCache = new Map<VhfComIndices, RegisteredSimVar<number>>();
  private static standbyFrequencyCache = new Map<VhfComIndices, RegisteredSimVar<number>>();
  private static standbyModeCache = new Map<VhfComIndices, RegisteredSimVar<number>>();

  public static getActiveFrequencyLocalVar(vhfIndex: VhfComIndices): RegisteredSimVar<number> {
    if (!RmpUtils.activeFrequencyCache.has(vhfIndex)) {
      RmpUtils.activeFrequencyCache.set(
        vhfIndex,
        RegisteredSimVar.create<number>(`L:FBW_RMP_FREQUENCY_ACTIVE_${vhfIndex}`, 'frequency bcd32'),
      );
    }
    return RmpUtils.activeFrequencyCache.get(vhfIndex)!;
  }

  public static getStandbyFrequencyLocalVar(vhfIndex: VhfComIndices): RegisteredSimVar<number> {
    if (!RmpUtils.standbyFrequencyCache.has(vhfIndex)) {
      RmpUtils.standbyFrequencyCache.set(
        vhfIndex,
        RegisteredSimVar.create<number>(`L:FBW_RMP_FREQUENCY_STANDBY_${vhfIndex}`, 'frequency bcd32'),
      );
    }
    return RmpUtils.standbyFrequencyCache.get(vhfIndex)!;
  }

  public static getActiveModeLocalVar(vhfIndex: VhfComIndices): RegisteredSimVar<number> {
    if (!RmpUtils.activeModeCache.has(vhfIndex)) {
      RmpUtils.activeModeCache.set(
        vhfIndex,
        RegisteredSimVar.create<number>(`L:FBW_RMP_MODE_ACTIVE_${vhfIndex}`, SimVarValueType.Enum),
      );
    }
    return RmpUtils.activeModeCache.get(vhfIndex)!;
  }

  public static getStandbyModeLocalVar(vhfIndex: VhfComIndices): RegisteredSimVar<number> {
    if (!RmpUtils.standbyModeCache.has(vhfIndex)) {
      RmpUtils.standbyModeCache.set(
        vhfIndex,
        RegisteredSimVar.create<number>(`L:FBW_RMP_MODE_STANDBY_${vhfIndex}`, SimVarValueType.Enum),
      );
    }
    return RmpUtils.standbyModeCache.get(vhfIndex)!;
  }

  public static swapVhfFrequency(vhfIndex: VhfComIndices): void {
    const newStandbyFreq = RmpUtils.getActiveFrequencyLocalVar(vhfIndex).get();
    const newStandbyMode = RmpUtils.getActiveModeLocalVar(vhfIndex).get();

    RmpUtils.getActiveFrequencyLocalVar(vhfIndex).set(RmpUtils.getStandbyFrequencyLocalVar(vhfIndex).get());
    RmpUtils.getActiveModeLocalVar(vhfIndex).set(RmpUtils.getStandbyModeLocalVar(vhfIndex).get());
    RmpUtils.getStandbyFrequencyLocalVar(vhfIndex).set(newStandbyFreq);
    RmpUtils.getStandbyModeLocalVar(vhfIndex).set(newStandbyMode);
  }
}
