import { DisplayComponent, EventBus, FSComponent, SimVarValueType } from '@microsoft/msfs-sdk';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';

interface EclClickspotsProps {
  bus: EventBus;
}

export class EclClickspots extends DisplayComponent<EclClickspotsProps> {
  private readonly sub = this.props.bus.getSubscriber<EwdSimvars>();

  render() {
    return (
      <div class="EclClickspots">
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
