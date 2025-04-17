import { SimVarValueType } from '@microsoft/msfs-sdk';
import { VhfComIndices } from '../../../shared/src/RadioTypes';

export class RmpUtils {
  private static activeFrequencyCache = new Map<VhfComIndices, number>();
  private static activeModeCache = new Map<VhfComIndices, number>();
  private static standbyFrequencyCache = new Map<VhfComIndices, number>();
  private static standbyModeCache = new Map<VhfComIndices, number>();

  public static getActiveFrequencyLocalVar(vhfIndex: VhfComIndices): number {
    if (!RmpUtils.activeFrequencyCache.has(vhfIndex)) {
      RmpUtils.activeFrequencyCache.set(
        vhfIndex,
        SimVar.GetRegisteredId(`L:FBW_RMP_FREQUENCY_ACTIVE_${vhfIndex}`, 'frequency bcd32', document.title),
      );
    }
    return RmpUtils.activeFrequencyCache.get(vhfIndex)!;
  }

  public static getStandbyFrequencyLocalVar(vhfIndex: VhfComIndices): number {
    if (!RmpUtils.standbyFrequencyCache.has(vhfIndex)) {
      RmpUtils.standbyFrequencyCache.set(
        vhfIndex,
        SimVar.GetRegisteredId(`L:FBW_RMP_FREQUENCY_STANDBY_${vhfIndex}`, 'frequency bcd32', document.title),
      );
    }
    return RmpUtils.standbyFrequencyCache.get(vhfIndex)!;
  }

  public static getActiveModeLocalVar(vhfIndex: VhfComIndices): number {
    if (!RmpUtils.activeModeCache.has(vhfIndex)) {
      RmpUtils.activeModeCache.set(
        vhfIndex,
        SimVar.GetRegisteredId(`L:FBW_RMP_MODE_ACTIVE_${vhfIndex}`, SimVarValueType.Enum, document.title),
      );
    }
    return RmpUtils.activeModeCache.get(vhfIndex)!;
  }

  public static getStandbyModeLocalVar(vhfIndex: VhfComIndices): number {
    if (!RmpUtils.standbyModeCache.has(vhfIndex)) {
      RmpUtils.standbyModeCache.set(
        vhfIndex,
        SimVar.GetRegisteredId(`L:FBW_RMP_MODE_STANDBY_${vhfIndex}`, SimVarValueType.Enum, document.title),
      );
    }
    return RmpUtils.standbyModeCache.get(vhfIndex)!;
  }

  public static swapVhfFrequency(vhfIndex: VhfComIndices): void {
    const newStandbyFreq = SimVar.GetSimVarValueFastReg(RmpUtils.getActiveFrequencyLocalVar(vhfIndex));
    const newStandbyMode = SimVar.GetSimVarValueFastReg(RmpUtils.getActiveModeLocalVar(vhfIndex));

    SimVar.SetSimVarValueRegNumber(
      RmpUtils.getActiveFrequencyLocalVar(vhfIndex),
      SimVar.GetSimVarValueFastReg(RmpUtils.getStandbyFrequencyLocalVar(vhfIndex)),
    );
    SimVar.SetSimVarValueRegNumber(
      RmpUtils.getActiveModeLocalVar(vhfIndex),
      SimVar.GetSimVarValueFastReg(RmpUtils.getStandbyModeLocalVar(vhfIndex)),
    );
    SimVar.SetSimVarValueRegNumber(RmpUtils.getStandbyFrequencyLocalVar(vhfIndex), newStandbyFreq);
    SimVar.SetSimVarValueRegNumber(RmpUtils.getStandbyModeLocalVar(vhfIndex), newStandbyMode);
  }
}
