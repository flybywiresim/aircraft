import { HandlerSubscription } from './HandlerSubscription';
import { MutableSubscribableSet, SubscribableSet, SubscribableSetEventType, SubscribableSetHandler } from './SubscribableSet';

/**
 * A pipe from an input subscribable set to an output mutable subscribable set. Each key added/removed notification
 * received by the pipe is used to add/remove keys to/from the output set.
 */
export class SubscribableSetPipe<I, O, HandlerType extends (set: ReadonlySet<I>, type: SubscribableSetEventType, key: I, ...args: any[]) => void>
  extends HandlerSubscription<HandlerType> {

  /**
   * Constructor.
   * @param from The input subscribable set.
   * @param to The output mutable subscribable set.
   * @param onDestroy A function which is called when this subscription is destroyed.
   */
  constructor(from: SubscribableSet<I>, to: MutableSubscribableSet<I>, onDestroy: (sub: SubscribableSetPipe<I, O, HandlerType>) => void);
  /**
   * Constructor.
   * @param from The input subscribable set.
   * @param to The output mutable subscribable set.
   * @param map A function which transforms this pipe's input keys.
   * @param onDestroy A function which is called when this subscription is destroyed.
   */
  constructor(from: SubscribableSet<I>, to: MutableSubscribableSet<O>, map: (from: I) => O, onDestroy: (sub: SubscribableSetPipe<I, O, HandlerType>) => void);
  // eslint-disable-next-line jsdoc/require-jsdoc
  constructor(
    from: SubscribableSet<I>,
    to: MutableSubscribableSet<I> | MutableSubscribableSet<O>,
    arg3: ((from: I) => O) | ((sub: SubscribableSetPipe<I, O, HandlerType>) => void),
    arg4?: (sub: SubscribableSetPipe<I, O, HandlerType>) => void
  ) {
    let handler: SubscribableSetHandler<I>;
    let initialNotifyFunc: () => void;
    let onDestroy: (sub: SubscribableSetPipe<I, O, HandlerType>) => void;

    if (typeof arg4 === 'function') {
      const toCast = to as MutableSubscribableSet<O>;
      const map = arg3 as (from: I) => O;

      handler = (set, type, key): void => {
        if (type === SubscribableSetEventType.Added) {
          toCast.add(map(key));
        } else {
          const mappedKey = map(key);

          // Only delete the mapped key if no other key in the input set maps to the same key
          for (const inputKey of set) {
            if (map(inputKey) === mappedKey) {
              return;
            }
          }

          toCast.delete(mappedKey);
        }
      };

      initialNotifyFunc = (): void => {
        const fromSet = from.get();
        const toAdd = new Set<O>();

        for (const key of fromSet) {
          toAdd.add(map(key));
        }

        for (const key of toCast.get()) {
          if (!toAdd.delete(key)) {
            toCast.delete(key);
          }
        }

        for (const key of toAdd) {
          toCast.add(key);
        }
      };

      onDestroy = arg4;
    } else {
      const toCast = to as MutableSubscribableSet<I>;

      handler = (set, type, key): void => {
        if (type === SubscribableSetEventType.Added) {
          toCast.add(key);
        } else {
          toCast.delete(key);
        }
      };

      initialNotifyFunc = (): void => {
        const fromSet = from.get();
        const toAdd = new Set(fromSet);

        for (const key of (to as MutableSubscribableSet<I>).get()) {
          if (!toAdd.delete(key)) {
            toCast.delete(key);
          }
        }

        for (const key of toAdd) {
          toCast.add(key);
        }
      };

      onDestroy = arg3 as (sub: SubscribableSetPipe<I, O, HandlerType>) => void;
    }

    super(handler as HandlerType, initialNotifyFunc, onDestroy);
  }
}