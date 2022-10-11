import { GeoPoint } from '../../../geo/GeoPoint';
import { ResourceConsumer, ResourceModerator } from '../../../utils/resource';
import { MapOwnAirplanePropsModule } from '../../map/modules/MapOwnAirplanePropsModule';
import { MapSystemController } from '../MapSystemController';
import { MapSystemKeys } from '../MapSystemKeys';
import { MapFollowAirplaneModule } from '../modules/MapFollowAirplaneModule';

/**
 * Modules required for MapFollowAirplaneController.
 */
export interface MapFollowAirplaneControllerModules {
  /** Own airplane properties module. */
  [MapSystemKeys.OwnAirplaneProps]: MapOwnAirplanePropsModule;

  /** Follow airplane module. */
  [MapSystemKeys.FollowAirplane]: MapFollowAirplaneModule;
}

/**
 * Context properties required for MapFollowAirplaneController.
 */
export interface MapFollowAirplaneControllerContext {
  /** Resource moderator for control of the map's projection target. */
  [MapSystemKeys.TargetControl]: ResourceModerator;
}

/**
 * Controls the target position of a map to follow the player airplane.
 */
export class MapFollowAirplaneController extends MapSystemController<MapFollowAirplaneControllerModules, any, any, MapFollowAirplaneControllerContext> {
  private readonly ownAirplanePropsModule = this.context.model.getModule(MapSystemKeys.OwnAirplaneProps);
  private readonly isFollowingAirplane = this.context.model.getModule(MapSystemKeys.FollowAirplane).isFollowing;

  private readonly mapProjectionParams = {
    target: new GeoPoint(0, 0)
  };

  private readonly targetControl = this.context[MapSystemKeys.TargetControl];

  private readonly targetControlConsumer: ResourceConsumer = {
    priority: 0,

    onAcquired: () => {
      this.isFollowingAirplane.set(true);
    },

    onCeded: () => {
      this.isFollowingAirplane.set(false);
    }
  };

  /** @inheritdoc */
  public onAfterMapRender(): void {
    this.targetControl.claim(this.targetControlConsumer);
  }

  /** @inheritdoc */
  public onBeforeUpdated(): void {
    if (this.isFollowingAirplane.get()) {
      this.mapProjectionParams.target.set(this.ownAirplanePropsModule.position.get());
      this.context.projection.setQueued(this.mapProjectionParams);
    }
  }

  /** @inheritdoc */
  public onMapDestroyed(): void {
    this.destroy();
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.targetControl.forfeit(this.targetControlConsumer);
  }
}