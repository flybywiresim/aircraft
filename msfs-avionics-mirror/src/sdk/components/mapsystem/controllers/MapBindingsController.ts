import { MutableSubscribable, Subscribable, Subscription } from '../../../sub';
import { MapSystemContext } from '../MapSystemContext';
import { MapSystemController } from '../MapSystemController';

/**
 * A binding from a source to a target.
 */
export type MapBinding<T> = {
  /** The source of the binding. */
  source: Subscribable<T>;

  /** The target of the binding. */
  target: MutableSubscribable<any, T>;
}

/**
 * A binding from a transformed source to a target.
 */
export type MapTransformedBinding<S, T> = {
  /** The source of the binding. */
  source: Subscribable<S>;

  /** The target of the binding. */
  target: MutableSubscribable<any, T>;

  /** A function which transforms source values before they are applied to the target. */
  map: (source: S) => T;
}

/**
 * A controller which maintains an arbitrary number of bindings.
 */
export class MapBindingsController extends MapSystemController {
  private pipes?: Subscription[];

  /**
   * Constructor.
   * @param context This controller's map context.
   * @param bindings This controller's bindings.
   */
  constructor(
    context: MapSystemContext<any, any, any, any>,
    private readonly bindings: Iterable<MapBinding<any> | MapTransformedBinding<any, any>>
  ) {
    super(context);
  }

  /** @inheritdoc */
  public onAfterMapRender(): void {
    const bindings = Array.from(this.bindings);

    if (bindings.length === 0) {
      this.destroy();
    }

    this.pipes = bindings.map(binding => {
      if ('map' in binding) {
        return binding.source.pipe(binding.target, binding.map);
      } else {
        return binding.source.pipe(binding.target);
      }
    });
  }

  /** @inheritdoc */
  public onMapDestroyed(): void {
    this.destroy();
  }

  /** @inheritdoc */
  public onWake(): void {
    this.pipes?.forEach(pipe => { pipe.resume(true); });
  }

  /** @inheritdoc */
  public onSleep(): void {
    this.pipes?.forEach(pipe => { pipe.pause(); });
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.pipes?.forEach(pipe => { pipe.destroy(); });
  }
}