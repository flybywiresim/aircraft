/* eslint-disable jsx-a11y/label-has-associated-control */
import { DisplayComponent, FSComponent, RenderPosition, Subscribable, VNode } from '@microsoft/msfs-sdk';
import './style.scss';
import { ActiveUriInformation } from 'instruments/src/PFD/MFD';

interface NavigatorPageProps {
    component: VNode;
    uri: string;
}

export class NavigatorPage extends DisplayComponent<NavigatorPageProps> {
    private topDivRef = FSComponent.createRef<HTMLDivElement>();

    render(): VNode {
        return (
            <div ref={this.topDivRef} class="MFDNavigatorContent">
                {this.props.component}
            </div>
        );
    }
}

interface NavigatorProps {
    active: Subscribable<ActiveUriInformation>;
    pageChangeCallback?: (index: number) => void;
}

export class Navigator extends DisplayComponent<NavigatorProps> {
    private navigatorRef = FSComponent.createRef<HTMLDivElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        // Render only desired page
        const nodes = FSComponent.createChildNodes(node, this.props.children);
        nodes.forEach((page) => {
            if (page.instance instanceof NavigatorPage && page.instance.props.uri === this.props.active.get().uri) {
                FSComponent.render(page, this.navigatorRef.instance, RenderPosition.In);
            }
        });

        this.props.active.sub((value) => {
            // Clear children nodes of navigator
            while (this.navigatorRef.instance.firstChild) {
                // There's still a reference to it somewhere, hence it isn't completely removed
                this.navigatorRef.instance.removeChild(this.navigatorRef.instance.firstChild);
            }

            // Render only desired page
            const nodes = FSComponent.createChildNodes(node, this.props.children);
            nodes.forEach((page) => {
                if (page.instance instanceof NavigatorPage && page.instance.props.uri === value.uri) {
                    FSComponent.render(page, this.navigatorRef.instance, RenderPosition.In);
                }
            });
        });
    }

    render(): VNode {
        return (
            <div ref={this.navigatorRef} class="MFDNavigatorContainer" />
        );
    }
}
