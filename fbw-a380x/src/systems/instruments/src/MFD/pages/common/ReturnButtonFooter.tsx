import { LifecycleComponent, Subscribable, VNode, FSComponent, SubscribableUtils } from '@microsoft/msfs-sdk';
import { Button } from '../../../MsfsAvionicsCommon/UiWidgets/Button';

export interface FlightPlanFooterProps {
  visible: Subscribable<boolean> | boolean;
  onReturnClicked: () => void;
}

export class ReturnButtonFooter extends LifecycleComponent<FlightPlanFooterProps> {
  public render(): VNode | null {
    return (
      <div
        class="fr"
        style={{
          visibility: SubscribableUtils.toSubscribable(this.props.visible, false).map((v) =>
            v ? 'visible' : 'hidden',
          ),
        }}
      >
        <Button
          label="RETURN"
          onClick={() => {
            this.props.onReturnClicked();
          }}
        />
      </div>
    );
  }
}
