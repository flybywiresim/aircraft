import { DisplayComponent, EventBus, FSComponent, SimVarValueType, VNode } from '@microsoft/msfs-sdk';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';
import { NXDataStore } from '@flybywiresim/fbw-sdk';

interface EclSoftKeysProps {
  bus: EventBus;
}

export class EclSoftKeys extends DisplayComponent<EclSoftKeysProps> {
  private readonly sub = this.props.bus.getSubscriber<EwdSimvars>();

  private readonly eclSoftKeysRef = FSComponent.createRef<HTMLDivElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    NXDataStore.getAndSubscribe(
      'CONFIG_A380X_SHOW_ECL_SOFTKEYS',
      (_, v) => {
        if (this.eclSoftKeysRef.getOrDefault()) {
          this.eclSoftKeysRef.instance.style.display = v === '1' ? 'flex' : 'none';
        }
      },
      '0',
    );
  }

  render() {
    return (
      <div class="EclSoftKeys" ref={this.eclSoftKeysRef}>
        <IconButton
          icon={'ecl-check'}
          containerStyle="width: 50px; height: 50px; margin-right: 10px;"
          onClick={() => {
            SimVar.SetSimVarValue('L:A32NX_BTN_CHECK_LH', SimVarValueType.Number, 1);
            setTimeout(() => SimVar.SetSimVarValue('L:A32NX_BTN_CHECK_LH', SimVarValueType.Number, 0), 50);
          }}
        />
        <IconButton
          icon={'ecl-single-down'}
          containerStyle="width: 50px; height: 50px; margin-right: 10px;"
          onClick={() => {
            SimVar.SetSimVarValue('L:A32NX_BTN_DOWN', SimVarValueType.Number, 1);
            setTimeout(() => SimVar.SetSimVarValue('L:A32NX_BTN_DOWN', SimVarValueType.Number, 0), 50);
          }}
        />
        <IconButton
          icon={'ecl-single-up'}
          containerStyle="width: 50px; height: 50px;"
          onClick={() => {
            SimVar.SetSimVarValue('L:A32NX_BTN_UP', SimVarValueType.Number, 1);
            setTimeout(() => SimVar.SetSimVarValue('L:A32NX_BTN_UP', SimVarValueType.Number, 0), 50);
          }}
        />
      </div>
    );
  }
}
