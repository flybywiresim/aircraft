import React, { FC } from 'react';
import { HouseDoor, Clipboard, Truck, Compass, BroadcastPin, ExclamationDiamond, Gear, Calculator } from 'react-bootstrap-icons';
import { Link, useHistory } from 'react-router-dom';

export const ToolBar = () => (
    <nav className="flex overflow-hidden flex-col justify-between w-32">
        <div className="flex flex-col items-center mt-11">
            <ToolBarButton to="/dashboard">
                <HouseDoor size={35} />
            </ToolBarButton>
            <ToolBarButton to="/dispatch">
                <Clipboard size={35} />
            </ToolBarButton>
            <ToolBarButton to="/ground">
                <Truck size={35} />
            </ToolBarButton>
            <ToolBarButton to="/performance">
                <Calculator size={35} />
            </ToolBarButton>
            <ToolBarButton to="/navigation">
                <Compass size={35} />
            </ToolBarButton>
            <ToolBarButton to="/atc">
                <BroadcastPin size={35} />
            </ToolBarButton>
            <ToolBarButton to="/failures">
                <ExclamationDiamond size={35} />
            </ToolBarButton>
        </div>

        <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-1.5 rounded-full bg-theme-accent" />
            <ToolBarButton to="/settings">
                <Gear color="currentColor" size={35} />
            </ToolBarButton>
        </div>
    </nav>
);

type ToolBarButtonProps = {
    to: string,
}

const ToolBarButton: FC<ToolBarButtonProps> = ({ to, children }) => {
    const history = useHistory();

    return (
        <Link
            to={to}
            className={`${history.location.pathname.includes(to) ? 'bg-theme-accent text-theme-text' : 'text-theme-unselected'}`
            + ' flex w-min items-center justify-center hover:text-theme-text bg-transparent hover:bg-theme-accent transition duration-100 py-3.5 px-3.5 rounded-md mt-4'}
        >
            {children}
        </Link>
    );
};
