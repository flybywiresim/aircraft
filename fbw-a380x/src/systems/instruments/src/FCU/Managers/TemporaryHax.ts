import { EventBus, HEvent } from '@microsoft/msfs-sdk';

/** This is a small class to fill in the old NavSystem code until all of the windows are ported to MSFS avionics framework. */
export abstract class TemporaryHax {
  private readonly tempSub = this.tempBus.getSubscriber<HEvent>();

  protected textValue: Element | null;

  constructor(
    private readonly tempBus: EventBus,
    protected divRef: HTMLElement,
  ) {
    this.textValue = this.getTextElement('Value');

    this.tempSub.on('hEvent').handle((event) => {
      if (event.startsWith('A320_Neo_FCU_')) {
        this.onEvent(event.substring(13));
      }
    });
  }

  protected onEvent(_event: string): void {}

  protected abstract init(): void;

  protected getDivElement(_name: string) {
    if (this.divRef != null) {
      return this.divRef.querySelector(`#${_name}`);
    }
  }

  protected set textValueContent(_textContent: string | null) {
    if (this.textValue != null) {
      this.textValue.textContent = _textContent;
      this.textValue.innerHTML = this.textValue.innerHTML.replace('{sp}', '&nbsp;');
    }
  }

  protected getElement(_type: string, _name: string): HTMLElement | null {
    if (this.divRef != null) {
      const allText = this.divRef.getElementsByTagName(_type);
      if (allText != null) {
        for (let i = 0; i < allText.length; ++i) {
          if (allText[i].id == _name) {
            return allText[i] as HTMLElement;
          }
        }
      }
    }
    return null;
  }

  protected getTextElement(_name: string) {
    return this.getElement('text', _name);
  }

  protected setTextElementActive(_text?: Element | null, _active?: boolean, _baro?: boolean) {
    if (_text !== undefined && _text !== null) {
      _text.setAttribute('class', `Common ${_active ? 'Active' : 'Inactive'} ${_baro ? 'BaroValue' : ''}`);
    }
  }

  protected setElementVisibility(_element?: HTMLElement | null, _show?: boolean) {
    if (_element !== undefined && _element !== null) {
      _element.style.display = _show ? 'block' : 'none';
    }
  }

  reboot() {
    this.init();
  }
}
