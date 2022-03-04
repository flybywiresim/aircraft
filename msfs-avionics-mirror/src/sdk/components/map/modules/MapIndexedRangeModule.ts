import { NumberUnitInterface, UnitFamily, UnitType } from '../../../utils/math/NumberUnit';
import { Subject } from '../../../utils/Subject';
import { MapRangeModule } from './MapRangeModule';

/**
 * A module describing the nominal range of a map.
 */
export class MapIndexedRangeModule extends MapRangeModule {
  /** The index of the map nominal range. */
  public readonly nominalRangeIndex = Subject.create(0);

  /** The array of possible map nominal ranges. */
  public readonly nominalRanges: Subject<readonly NumberUnitInterface<UnitFamily.Distance>[]>
    = Subject.create([UnitType.NMILE.createNumber(1)] as readonly NumberUnitInterface<UnitFamily.Distance>[]);

  /** @inheritdoc */
  constructor() {
    super();

    this.nominalRanges.sub(this.onNominalRangesChanged.bind(this));
  }

  /**
   * A callback which is called when the nominal range array changes.
   * @param array The new array.
   */
  private onNominalRangesChanged(array: readonly NumberUnitInterface<UnitFamily.Distance>[]): void {
    const currentIndex = this.nominalRangeIndex.get();
    this.setNominalRangeIndex(Utils.Clamp(currentIndex, 0, array.length - 1));
  }

  /**
   * Sets the nominal range by index.
   * @param index The index of the new nominal range.
   * @returns The value of the new nominal range.
   * @throws Error if index of out of bounds.
   */
  public setNominalRangeIndex(index: number): NumberUnitInterface<UnitFamily.Distance> {
    const rangeArray = this.nominalRanges.get();
    if (index < 0 || index >= rangeArray.length) {
      throw new Error('Index out of bounds.');
    }

    const range = rangeArray[index];
    this.nominalRangeIndex.set(index);
    this.nominalRange.set(range);
    return range;
  }
}