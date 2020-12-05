import React from 'react';
import {
    Link
} from 'react-router-dom';

type ToolbarProps = {
    fetchSimbrief: Function;
    logo: string,
};

type ToolbarState = {
    activeIndex: number;
};

class Toolbar extends React.Component<ToolbarProps, ToolbarState> {
    constructor(props: ToolbarProps) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    tabs = [
        { id: 1, name: 'Dashboard', link: 'dashboard'},
        { id: 2, name: 'Loadsheet', link: 'loadsheet'},
        { id: 3, name: 'Flight', link: 'flight' },
        { id: 4, name: 'Ground', link: 'ground'},
        { id: 5, name: 'Multiplayer', link: 'multiplayer' },
        { id: 6, name: 'Settings', link: 'settings' }
    ];

    state: ToolbarState = {
        activeIndex: this.indexInit(),
    };

    indexInit(): number {
        const url = window.location.pathname;
        let index = 1;
        this.tabs.map((tab) => {
            if (("/" + tab.link) === url) {
                index = tab.id;
            } else if (url === "/") {
                index = 1;
            }
        });
        return index;
    }

    handleClick(index: number) {
        return (() => {
            this.setState({activeIndex: index });
        });
    }

    render() {
        return (
            <div className="Toolbar">
                <img src={this.props.logo} className="FBW-Logo" alt="logo" />

                <div id="Tabs">
                    {
                        this.tabs.map((tab) =>
                            <div key={tab.id} className={tab.id === this.state.activeIndex ? 'Tab Active' : 'Tab'} onClick={this.handleClick(tab.id)}>
                                <Link to={"/" + tab.link}>{tab.name}</Link>
                            </div>
                        )
                    }

                    <div id="LoadSimbrief" className="Tab">
                        <p onClick={() => this.props.fetchSimbrief()}>
                            Load Flightdata
                        </p>
                    </div>
                </div>

                <div id="ProfileToolbar">
                    <Link to="/profile">
                        <i className="material-icons" id="Icon">account_circle</i>
                    </Link>
                </div>
            </div>
        );
    }
}

export default Toolbar;
