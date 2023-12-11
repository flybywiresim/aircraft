import { ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
// @ts-ignore
import FbwTail from '../Assets/FBW-Tail.svg';
import { PageNumber } from '../shared/common';
import { Icon } from './Icons';

interface NavbarProps extends ComponentProps {
    activePage: Subject<PageNumber>
}

interface NavButtonProps extends ComponentProps {
    activePage: Subject<PageNumber>;
    page: PageNumber;
    class?: string;
    activeClass?: string;
    inactiveClass?: string;
}

interface NavIconProps extends ComponentProps {
    activePage: Subject<PageNumber>;
    page: PageNumber;
}

export class Navbar extends DisplayComponent<NavbarProps> {
    private readonly tabs: [page: PageNumber, icon: string][] = [
        [PageNumber.Dispatch, 'clipboard'],
        [PageNumber.Ground, 'truck'],
        [PageNumber.Performance, 'calculator'],
        [PageNumber.Navigation, 'compass'],
        [PageNumber.ATC, 'broadcast-pin'],
        [PageNumber.Failures, 'exclamation-diamond'],
        [PageNumber.Checklists, 'journal'],
        [PageNumber.Presets, 'sliders'],
    ]

    render(): VNode {
        return (
            <div class="flex h-full w-32 shrink-0 flex-col justify-between py-6">
                <div class="mt-9 flex flex-col items-center space-y-4">
                    <NavIcon page={PageNumber.Dashboard} activePage={this.props.activePage}>
                        <img class="w-[35px]" src={FbwTail} alt="FbwTail" />
                    </NavIcon>
                    {
                        this.tabs.map(([page, icon]) => (
                            <NavIcon page={page} activePage={this.props.activePage}>
                                <Icon icon={icon} size={35} class="" />
                            </NavIcon>
                        ))
                    }
                </div>

                <div class="flex flex-col items-center">
                    <div class="my-4 h-1.5 w-14 rounded-full bg-theme-accent" />
                    <NavIcon page={PageNumber.Settings} activePage={this.props.activePage}>
                        <Icon icon="gear" size={35} class="" />
                    </NavIcon>
                </div>
            </div>
        );
    }
}

export class NavButton extends DisplayComponent<NavButtonProps> {
    private readonly root = FSComponent.createRef<HTMLSpanElement>();

    onAfterRender() {
        this.root.instance.addEventListener('click', this.handlePressed);
    }

    private handlePressed = () => this.props.activePage.set(this.props.page);

    private readonly activeClass = this.props.activePage.map((value) => {
        const activeClassText = (value === this.props.page) ? this.props.activeClass : this.props.inactiveClass;

        return `${this.props.class} ${activeClassText}`;
    })

    render(): VNode {
        return (
            <div ref={this.root} class={this.activeClass}>
                {this.props.children}
            </div>
        );
    }
}

// Pre themed for simplification
export class NavIcon extends DisplayComponent<NavIconProps> {
    render(): VNode {
        return (
            <NavButton
                page={this.props.page}
                activePage={this.props.activePage}
                activeClass="bg-theme-accent text-theme-text"
                inactiveClass="text-theme-unselected"
                class="flex items-center justify-center rounded-md p-3.5 transition duration-100 hover:bg-theme-accent hover:text-theme-text"
            >
                {this.props.children}
            </NavButton>
        );
    }
}
