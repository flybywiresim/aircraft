import React from 'react';
import { IconSettings } from '@tabler/icons';
import logo from '../Assets/fbw-logo.svg';
import { Navbar } from '../Components/Navbar';

type ToolbarProps = {
    setPageIndex: (number) => void;
};

type ToolbarState = {
    activeIndex: number;
};

class ToolBar extends React.Component<ToolbarProps, ToolbarState> {
    tabs = [
        'Dashboard',
        'Dispatch',
        'Flight',
        'Performance',
        'Company',
        'Ground',
    ];

    constructor(props: ToolbarProps) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(index: number) {
        this.props.setPageIndex(index);
    }

    render() {
        return (
            <nav className="bg-gray-800">
                <div className="flex justify-start py-3 px-6">
                    <div className="flex-shrink-0 flex items-center">
                        <img className="h-20" src={logo} />
                    </div>
                    <Navbar tabs={this.tabs} onSelected={(index) => this.handleClick(index)} />
                    <div className="ml-auto flex items-center text-white">
                        <div>
                            <a onClick={() => this.handleClick(6)}>
                                <IconSettings className="hover:text-blue-light" size={30} stroke={1.5} strokeLinejoin="miter" />
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }
}

export default ToolBar;
