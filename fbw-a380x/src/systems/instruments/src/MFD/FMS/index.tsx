import React, { FC } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useActiveOrTemporaryFlightPlan } from '@instruments/common/flightplan';
import { Dropdown, DropdownLink } from '../Components/Dropdown';
import { Pages } from './Pages';
import { MFDRedirect, MFDRoute } from '../Components/MFDRoute';
import { MFDMessagesList } from '../Messages/MFDMessagesList';
import { MFDMessageArea } from '../Messages/MFDMessageArea';

export const FMS = () => {
    const { path } = useRouteMatch();

    return (
        <>
            <StatusBar />

            <PagesContainer />

            <ActiveDropdown />
            <PositionDropdown />
            <SecIndexDropdown />
            <DataDropdown />

            <MFDMessageArea path={path} />
        </>
    );
};

const ActiveDropdown: React.FC = () => {
    const history = useHistory();

    return (
        <Dropdown x={0} y={45} title="ACTIVE" active={history.location.pathname.includes('active')}>
            <DropdownLink link="active/f-pln">F-PLN</DropdownLink>
            <DropdownLink link="active/perf">PERF</DropdownLink>
            <DropdownLink link="active/fuel&load">FUEL&LOAD</DropdownLink>
            <DropdownLink link="active/wind">WIND</DropdownLink>
            <DropdownLink link="active/init">INIT</DropdownLink>
        </Dropdown>
    );
};

const PositionDropdown: React.FC = () => (
    <Dropdown x={192} y={45} title="POSITION">
        <DropdownLink link="position/monitor">MONITOR</DropdownLink>
        <DropdownLink link="position/report">REPORT</DropdownLink>
        <DropdownLink link="position/navaids">NAVAIDS</DropdownLink>
        <DropdownLink link="position/irs">IRS</DropdownLink>
        <DropdownLink link="position/gps">GPS</DropdownLink>
    </Dropdown>
);

const SecIndexDropdown: React.FC = () => (
    <Dropdown x={384} y={45} title="SEC INDEX">
        <DropdownLink link="sec/1">SEC 1</DropdownLink>
        <DropdownLink link="sec/2">SEC 2</DropdownLink>
        <DropdownLink link="sec/3">SEC 3</DropdownLink>
    </Dropdown>
);

const DataDropdown: React.FC = () => (
    <Dropdown x={576} y={45} title="DATA">
        <DropdownLink link="data/status">STATUS</DropdownLink>
        <DropdownLink link="data/waypoint">WAYPOINT</DropdownLink>
        <DropdownLink link="data/navaid">NAVAID</DropdownLink>
        <DropdownLink link="data/route">ROUTE</DropdownLink>
        <DropdownLink link="data/airport">AIRPORT</DropdownLink>
        <DropdownLink link="data/printer">PRINTER</DropdownLink>
    </Dropdown>
);

const StatusBar: React.FC = () => {
    const history = useHistory();
    const { path } = useRouteMatch();
    const [, isTemporary] = useActiveOrTemporaryFlightPlan();

    let statusText = history.location.pathname.toUpperCase().substring(path.length + 1);
    const messageOverviewPage = statusText === 'MESSAGES_LIST';
    if (statusText !== undefined && statusText.length > 0) statusText = statusText.replace('/_/g', ' ');

    return (
        <>
            <rect fill="#eee" x={2} y={105} width={586} height={35} />
            <rect fill="#eee" x={590} y={105} width={73} height={35} />
            <rect fill="#eee" x={665} y={105} width={100} height={35} />

            <text x={10} y={134} letterSpacing={0.75} fill="black" fontSize={28}>{statusText}</text>

            {isTemporary && !messageOverviewPage && (
                <>
                    <rect className="Yellow Fill" x={678} y={106} width={76} height={33} />

                    <text className="DarkGray" fontSize={31} x={678} y={134}>TMPY</text>
                </>
            )}
        </>
    );
};

const PagesContainer: FC = () => (
    <>
        <MFDRoute exact path="/">
            <MFDRedirect to="/active/init" />
        </MFDRoute>
        {/* Active */}
        <MFDRoute path="/active/f-pln" component={Pages.Active.Fpln} />
        <MFDRoute path="/active/perf">
            <text fontSize={26} fill="white" x={384} y={512} textAnchor="middle">PERF</text>
        </MFDRoute>
        <MFDRoute path="/active/fuel&load" component={Pages.Active.Fuelload} />
        <MFDRoute path="/active/wind">
            <text fontSize={26} fill="white" x={384} y={512} textAnchor="middle">WING</text>
        </MFDRoute>
        <MFDRoute path="/active/init" component={Pages.Active.Init} />

        {/* Data */}
        <MFDRoute path="/data/status" component={Pages.Data.Status} />
        <MFDRoute path="/data/waypoint" component={Pages.Data.Waypoint} />
        <MFDRoute path="/data/navaid" component={Pages.Data.Navaid} />
        <MFDRoute path="/data/route">
            <text fontSize={26} fill="white" x={384} y={512} textAnchor="middle">ROUTE</text>
        </MFDRoute>
        <MFDRoute path="/data/airport" component={Pages.Data.Airport} />
        <MFDRoute path="/data/printer">
            <text fontSize={26} fill="white" x={384} y={512} textAnchor="middle">PRINTER</text>
        </MFDRoute>

        {/* FMS message area */}
        <MFDRoute path="/messages_list" component={MFDMessagesList} />
    </>
);
