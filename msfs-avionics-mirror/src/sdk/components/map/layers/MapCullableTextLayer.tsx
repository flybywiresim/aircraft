import { MapCullableTextLabelManager } from '../MapCullableTextLabel';
import { MapLayerProps } from '../MapLayer';
import { MapCanvasLayerCanvasInstance } from './MapCanvasLayer';
import { MapSyncedCanvasLayer } from './MapSyncedCanvasLayer';

/**
 * Component props for MapTextLayer.
 */
export interface MapTextLayerProps extends MapLayerProps<any> {
  /** The text manager to use. */
  manager: MapCullableTextLabelManager;
}

/**
 * A layer which displays text which can be culled to avoid overlap.
 */
export class MapCullableTextLayer extends MapSyncedCanvasLayer<MapTextLayerProps> {
  // eslint-disable-next-line jsdoc/require-jsdoc
  public onUpdated(time: number, elapsed: number): void {
    super.onUpdated(time, elapsed);

    this.props.manager.update(this.props.mapProjection);
    this.redrawLabels();
  }

  /**
   * Clears this layer's canvas and redraws the currently visible labels registered to this layer's text manager.
   */
  private redrawLabels(): void {
    const labels = this.props.manager.visibleLabels;
    const display = (this.display as MapCanvasLayerCanvasInstance);
    display.clear();
    for (let i = labels.length - 1; i >= 0; i--) {
      labels[i].draw(display.context, this.props.mapProjection);
    }
  }
}