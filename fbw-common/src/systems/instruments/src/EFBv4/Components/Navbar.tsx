import { ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
// @ts-ignore
import FbwTail from '../Assets/FBW-Tail.svg';
import { PageNumber } from '../shared/common';

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
    render(): VNode {
        return (
            <div class="flex h-full w-32 shrink-0 flex-col justify-between py-6">
                <div class="mt-9 flex flex-col items-center space-y-4">
                    <NavIcon page={PageNumber.Dashboard} activePage={this.props.activePage}>
                        <img class="w-[35px]" src={FbwTail} alt="FbwTail" />
                    </NavIcon>
                    <NavIcon page={PageNumber.Dispatch} activePage={this.props.activePage}>
                        <i class="bi-clipboard text-[35px] text-inherit" />
                    </NavIcon>
                    <NavIcon page={PageNumber.Ground} activePage={this.props.activePage}>
                        <i class="bi-truck text-[35px] text-inherit" />
                    </NavIcon>
                    <NavIcon page={PageNumber.Performance} activePage={this.props.activePage}>
                        <i class="bi-calculator text-[35px] text-inherit" />
                    </NavIcon>
                    <NavIcon page={PageNumber.Navigation} activePage={this.props.activePage}>
                        <i class="bi-compass text-[35px] text-inherit" />
                    </NavIcon>
                    <NavIcon page={PageNumber.ATC} activePage={this.props.activePage}>
                        <i class="bi-broadcast-pin text-[35px] text-inherit" />
                    </NavIcon>
                    <NavIcon page={PageNumber.Failures} activePage={this.props.activePage}>
                        <i class="bi-exclamation-diamond text-[35px] text-inherit" />
                    </NavIcon>
                    <NavIcon page={PageNumber.Checklists} activePage={this.props.activePage}>
                        <i class="bi-journal text-[35px] text-inherit" />
                    </NavIcon>
                    <NavIcon page={PageNumber.Presets} activePage={this.props.activePage}>
                        <i class="bi-sliders text-[35px] text-inherit" />
                    </NavIcon>
                </div>

                <div class="flex flex-col items-center">
                    <div class="my-4 h-1.5 w-14 rounded-full bg-theme-accent" />
                    <NavIcon page={PageNumber.Settings} activePage={this.props.activePage}>
                        <i class="bi-gear text-[35px] text-inherit" />
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
