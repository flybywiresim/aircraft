import { ComponentProps, DisplayComponent, FSComponent, Subscribable, SubscribableArray, Subscription, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

interface RadioButtonGroupProps extends ComponentProps {
    values: SubscribableArray<string>;
    selectedIndex: Subscribable<number>;
    idPrefix: string;
    onChangeCallback: (newSelectedIndex: number) => void;
}
export class RadioButtonGroup extends DisplayComponent<RadioButtonGroupProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        for (let i = 0; i < this.props.values.length; i++) {
            document.getElementById(`${this.props.idPrefix}_${i}`).addEventListener('change', () => this.props.onChangeCallback(i));

            if (i === this.props.selectedIndex.get()) {
                document.getElementById(`${this.props.idPrefix}_${i}`).setAttribute('checked', 'checked');
            } else {
                document.getElementById(`${this.props.idPrefix}_${i}`).removeAttribute('checked');
            }
        }

        this.subs.push(this.props.selectedIndex.sub((val) => {
            for (let i = 0; i < this.props.values.length; i++) {
                if (i === val) {
                    document.getElementById(`${this.props.idPrefix}_${i}`).setAttribute('checked', 'checked');
                } else {
                    document.getElementById(`${this.props.idPrefix}_${i}`).removeAttribute('checked');
                }
            }
        }));
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <form>
                {this.props.values.getArray().map((el, idx) => (
                    <label class="MFDRadioButton" htmlFor={`${this.props.idPrefix}_${idx}`}>
                        <input type="radio" name="entityType" id={`${this.props.idPrefix}_${idx}`} />
                        <span>{el}</span>
                    </label>
                ))}
            </form>
        );
    }
}
