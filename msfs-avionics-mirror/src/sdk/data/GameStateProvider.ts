import { Subject } from '../sub/Subject';
import { Subscribable } from '../sub/Subscribable';

/**
 * A utility class which provides the current game state.
 */
export class GameStateProvider {
  private static INSTANCE?: GameStateProvider;

  private readonly gameState = Subject.create<GameState | undefined>(undefined);

  /**
   * Constructor.
   */
  private constructor() {
    window.document.addEventListener('OnVCockpitPanelAttributesChanged', this.onAttributesChanged.bind(this));
    this.onAttributesChanged();
  }

  /**
   * Responds to changes in document attributes.
   */
  private onAttributesChanged(): void {
    if (window.parent?.document.body.hasAttribute('gamestate')) {
      const attribute = window.parent.document.body.getAttribute('gamestate');
      if (attribute !== null) {
        this.gameState.set((GameState as any)[attribute]);
        return;
      }
    }

    this.gameState.set(undefined);
  }

  /**
   * Gets a subscribable which provides the current game state.
   * @returns A subscribable which provides the current game state.
   */
  public static get(): Subscribable<GameState | undefined> {
    return (GameStateProvider.INSTANCE ??= new GameStateProvider()).gameState;
  }
}