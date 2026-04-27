import { ConsumerSubject, DisplayComponent, EventBus, VNode, FSComponent } from '@microsoft/msfs-sdk';
import { TodPauseOverlayControlEvents, TodPauseOverlayState } from '@shared/TodPauseOverlayEvents';

import './style.scss';

export interface PopupProps {
  bus: EventBus;
}

const DEFAULT_TOD_PAUSE_OVERLAY_STATE: TodPauseOverlayState = {
  visible: false,
  title: '',
  message: '',
};

export class PopupComponent extends DisplayComponent<PopupProps> {
  private readonly todPauseOverlayState = ConsumerSubject.create(null, DEFAULT_TOD_PAUSE_OVERLAY_STATE);
  private readonly panelRef = FSComponent.createRef<HTMLDivElement>();
  private listener: ViewListener.ViewListener;

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.keyCode === KeyCode.KEY_P && this.todPauseOverlayState.get().visible) {
      this.props.bus.getPublisher<TodPauseOverlayControlEvents>().pub('tod_pause_overlay', {
        visible: false,
        title: '',
        message: '',
      });
    }
  };

  private onSimDisabledChanged = (simDisabled: boolean): void => {
    if (!simDisabled) {
      this.props.bus.getPublisher<TodPauseOverlayControlEvents>().pub('tod_pause_overlay', {
        visible: false,
        title: '',
        message: '',
      });
    }
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    // OR USE A:SIM DISABLED but that will not make the toolbar work
    // OR Use the regular K:PAUSE_SET event and only intercept the key
    this.listener = RegisterViewListener('JS_LISTENER_TOOLBAR_PANELS');

    //  this.listener.triggerToAllSubscribers

    this.listener.on('SetActivePauseEnabled', (isPaused: boolean) => {
      console.log('LOL', isPaused);
      if (!isPaused && this.todPauseOverlayState.get().visible) {
        this.props.bus
          .getPublisher<TodPauseOverlayControlEvents>()
          .pub('tod_pause_overlay', { visible: false, title: '', message: '' });
      }
    });

    this.todPauseOverlayState.setConsumer(
      this.props.bus.getSubscriber<TodPauseOverlayControlEvents>().on('tod_pause_overlay'),
    );
    this.todPauseOverlayState.sub((state) => {
      console.log('TOD Pause Overlay State changed:', state);
      if (state.visible) {
        window.document.addEventListener('keydown', this.handleKeyDown);
        this.panelRef.instance.classList.remove('hidden');
        Coherent.trigger('FOCUS_INPUT_FIELD', 1333, '', '', '', false);
        Coherent.call('TOOLBAR_SET_ACTIVE_PAUSE', true);
      } else {
        window.document.removeEventListener('keydown', this.handleKeyDown);

        Coherent.trigger('UNFOCUS_INPUT_FIELD', 1333);

        Coherent.call('TOOLBAR_SET_ACTIVE_PAUSE', false);

        this.panelRef.instance.classList.add('hidden');
      }
    });
  }

  doRender(): VNode {
    return (
      <div id="resume" ref={this.panelRef} class="absolute inset-0 z-50 flex hidden items-center justify-center">
        <div class=" mx-6  w-full  rounded-xl bg-theme-body px-10 py-8 text-center">
          <h1 class="text-4xl font-bold">{this.todPauseOverlayState.map((state) => state.title)}</h1>
          <p class="mb-8 text-xl leading-relaxed text-theme-text">
            {this.todPauseOverlayState.map((state) => state.message)}
          </p>
        </div>
      </div>
    );
  }

  render(): VNode | null {
    return this.doRender();
  }
}
