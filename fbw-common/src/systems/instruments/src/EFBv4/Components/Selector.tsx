import { ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { NavButton } from './Navbar';

interface SelectorProps extends ComponentProps {
    class: string;
    tabs: [page: number, name: String][];
    activePage: Subject<number>;
}

export class Selector extends DisplayComponent<SelectorProps> {
    render(): VNode {
        return (
            <div class={`flex justify-between ${this.props.class}`}>
                <div class="flex divide-x divide-theme-accent overflow-hidden rounded-md border border-theme-accent">
                    {
                        this.props.tabs.map(([page, name]) => (
                            <NavButton
                                inactiveClass="flex items-center bg-opacity-0 px-6 py-2 transition duration-300 hover:bg-opacity-100"
                                activeClass="flex items-center px-6 py-2 bg-theme-accent bg-opacity-100"
                                page={page}
                                activePage={this.props.activePage}
                            >
                                {name}
                            </NavButton>
                        ))
                    }
                </div>
            </div>
        );
    }
}
