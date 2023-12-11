import { ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
// @ts-ignore
import FbwTail from '../Assets/FBW-Tail.svg';
import { PageEnum } from '../shared/common';
import { Button } from './Button';

interface NavbarProps extends ComponentProps {
    activePage: Subject<number>
}

interface NavButtonProps extends ComponentProps {
    activePage: Subject<number>;
    page: number;
    class?: string;
    activeClass?: string;
    inactiveClass?: string;
}

interface NavIconProps extends ComponentProps {
    activePage: Subject<number>;
    page: number;
}

export class Navbar extends DisplayComponent<NavbarProps> {
    private readonly tabs: [page: number, icon: string][] = [
        [PageEnum.MainPage.Dispatch, 'clipboard'],
        [PageEnum.MainPage.Ground, 'truck'],
        [PageEnum.MainPage.Performance, 'calculator'],
        [PageEnum.MainPage.Navigation, 'compass'],
        [PageEnum.MainPage.ATC, 'broadcast-pin'],
        [PageEnum.MainPage.Failures, 'exclamation-diamond'],
        [PageEnum.MainPage.Checklists, 'journal'],
        [PageEnum.MainPage.Presets, 'sliders'],
    ]

    render(): VNode {
        return (
            <div class="flex h-full w-32 shrink-0 flex-col justify-between py-6">
                <div class="mt-9 flex flex-col items-center gap-4">
                    <NavIcon page={PageEnum.MainPage.Dashboard} activePage={this.props.activePage}>
                        <img class="w-[35px]" src={FbwTail} alt="FbwTail" />
                    </NavIcon>
                    {
                        this.tabs.map(([page, icon]) => (
                            <NavIcon page={page} activePage={this.props.activePage}>
                                <i class={`bi-${icon} text-inherit text-[35px]`} />
                            </NavIcon>
                        ))
                    }
                </div>

                <div class="flex flex-col items-center">
                    <div class="my-4 h-1.5 w-14 rounded-full bg-theme-accent" />
                    <NavIcon page={PageEnum.MainPage.Settings} activePage={this.props.activePage}>
                        <i class="bi-gear text-[35px] text-inherit" />
                    </NavIcon>
                </div>
            </div>
        );
    }
}

export class NavButton extends DisplayComponent<NavButtonProps> {
    private handlePressed = () => this.props.activePage.set(this.props.page);

    private readonly activeClass = this.props.activePage.map((value) => {
        const activeClassText = (value === this.props.page) ? this.props.activeClass : this.props.inactiveClass;

        return `${this.props.class} ${activeClassText}`;
    })

    render(): VNode {
        return (
            <Button onClick={this.handlePressed}>
                <div class={this.activeClass}>
                    {this.props.children}
                </div>
            </Button>
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
