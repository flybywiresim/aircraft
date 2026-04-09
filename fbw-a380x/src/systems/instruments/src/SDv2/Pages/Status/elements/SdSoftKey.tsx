import { DisplayComponent, FSComponent, SimVarValueType, VNode } from '@microsoft/msfs-sdk';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { NXDataStore } from '@flybywiresim/fbw-sdk';

interface SdSoftKeyProps {}

export class SdSoftKey extends DisplayComponent<SdSoftKeyProps> {
  private readonly sdSoftKeyRef = FSComponent.createRef<HTMLDivElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    NXDataStore.getAndSubscribeLegacy(
      'CONFIG_A380X_SHOW_ECL_SOFTKEYS',
      (_, v) => {
        if (this.sdSoftKeyRef.getOrDefault()) {
          this.sdSoftKeyRef.instance.style.display = v === '1' ? 'flex' : 'none';
        }
      },
      '0',
    );
  }

  render() {
    return (
      <div class="sd-sts-soft-key" ref={this.sdSoftKeyRef}>
        <IconButton
          icon={'double-right'}
          containerStyle="width: 50px; height: 50px;"
          onClick={() => {
            SimVar.SetSimVarValue('H:A32NX_SD_STS_NEXT_PAGE', SimVarValueType.Number, 1);
          }}
        />
      </div>
    );
  }
}
