
import { BitFlags, ReadonlyFloat64Array } from '../../../math';
import { HorizonProjection, HorizonProjectionChangeType } from '../HorizonProjection';
import { HorizonCanvasLayer, HorizonCanvasLayerProps } from './HorizonCanvasLayer';

/**
 * A canvas horizon layer whose size and position is synced with the horizon projection window.
 */
export class HorizonSyncedCanvasLayer extends HorizonCanvasLayer<HorizonCanvasLayerProps> {
  /** @inheritdoc */
  public onAttached(): void {
    super.onAttached();

    this.updateFromProjectedSize(this.props.projection.getProjectedSize());
  }

  /**
   * Updates this layer according to the current size of the horizon projected window.
   * @param projectedSize The size of the horizon projected window.
   */
  private updateFromProjectedSize(projectedSize: ReadonlyFloat64Array): void {
    this.setWidth(projectedSize[0]);
    this.setHeight(projectedSize[1]);

    const displayCanvas = this.display.canvas;
    displayCanvas.style.left = '0px';
    displayCanvas.style.top = '0px';
  }

  /** @inheritdoc */
  public onMapProjectionChanged(projection: HorizonProjection, changeFlags: number): void {
    if (BitFlags.isAll(changeFlags, HorizonProjectionChangeType.ProjectedSize)) {
      this.updateFromProjectedSize(projection.getProjectedSize());
    }
  }
}