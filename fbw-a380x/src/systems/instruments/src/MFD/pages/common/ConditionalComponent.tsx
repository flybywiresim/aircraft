import { ComponentProps, DisplayComponent, FSComponent, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

interface ConditionalComponentProps extends ComponentProps {
    componentIfTrue: VNode;
    componentIfFalse: VNode;
    condition: Subscribable<boolean>;
}

/*
 * Displays the title bar, with optional markers for lateral offsets, engine out and temporary flight plan
 */
export class ConditionalComponent extends DisplayComponent<ConditionalComponentProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private trueComponentRef = FSComponent.createRef<HTMLDivElement>();

    private falseComponentRef = FSComponent.createRef<HTMLDivElement>();

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.subs.push(this.props.condition.sub((v) => {
            this.trueComponentRef.instance.style.display = v ? 'block' : 'none';
            this.falseComponentRef.instance.style.display = v ? 'none' : 'block';
        }, true));
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <div>
                <div ref={this.trueComponentRef}>
                    {this.props.componentIfTrue}
                </div>
                <div ref={this.falseComponentRef}>
                    {this.props.componentIfFalse}
                </div>
            </div>
        );
    }
}
