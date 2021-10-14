import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { SimVarProvider, useSimVar } from '@instruments/common/simVars';
import { getRenderTarget, setIsEcamPage } from '@instruments/common/defaults';
import { PageTitle } from '../../Common/PageTitle';
import './Wheel.scss';
import { HydraulicsProvider, useHydraulics } from '../../Common/HydraulicsProvider';
import { HydraulicIndicator } from '../../Common/HydraulicIndicator';
import { ComponentPositionProps } from '../../Common/ComponentPositionProps';
import { EcamPage } from '../../Common/EcamPage';
import { SvgGroup } from '../../Common/SvgGroup';
import { Spoilers } from '../../Common/Spoilers';

setIsEcamPage('wheel_page');

const maxStaleness = 300;

export const WheelPage = () => {
    const [temperature1] = useSimVar('L:A32NX_REPORTED_BRAKE_TEMPERATURE_1', 'celsius', maxStaleness);
    const [temperature2] = useSimVar('L:A32NX_REPORTED_BRAKE_TEMPERATURE_2', 'celsius', maxStaleness);
    const [temperature3] = useSimVar('L:A32NX_REPORTED_BRAKE_TEMPERATURE_3', 'celsius', maxStaleness);
    const [temperature4] = useSimVar('L:A32NX_REPORTED_BRAKE_TEMPERATURE_4', 'celsius', maxStaleness);

    const temperatures: number[] = [temperature1, temperature2, temperature3, temperature4];

    const maxTemperatureIndex = temperatures.reduce((maxIndex, element, index, array) => (element > array[maxIndex] ? index : maxIndex), 0);

    return (
        <EcamPage name="main-wheel">
            <PageTitle x={6} y={115} text="WHEEL" />

            <HydraulicsProvider>
                <Spoilers x={103} y={64} />

                <NoseWheelSteering x={205} y={200} />
                <LandingGearCtl x={255} y={263} />
                <AntiSkid x={300} y={312} />

                <NormalBraking x={220} y={333} />
                <AlternateBraking x={220} y={360} />
            </HydraulicsProvider>

            <AutoBrake x={300} y={460} />

            <Gear x={18} y={210} location="left" />
            <Wheels
                x={12}
                y={318}
                left={{ number: 1, temperature: temperatures[0], hottest: maxTemperatureIndex === 0 }}
                right={{ number: 2, temperature: temperatures[1], hottest: maxTemperatureIndex === 1 }}
            />

            <Gear x={210} y={107} location="center" />
            <WheelArch x={298} y={370} type="bottom" />
            <WheelArch x={406} y={370} type="bottom" />

            <Gear x={401} y={210} location="right" />
            <Wheels
                x={436}
                y={318}
                left={{ number: 3, temperature: temperatures[2], hottest: maxTemperatureIndex === 2 }}
                right={{ number: 4, temperature: temperatures[3], hottest: maxTemperatureIndex === 3 }}
            />
        </EcamPage>
    );
};

const NoseWheelSteering = ({ x, y }: ComponentPositionProps) => {
    const [antiSkidActive] = useSimVar('ANTISKID BRAKES ACTIVE', 'Bool', maxStaleness);

    return !antiSkidActive ? (
        <SvgGroup x={x} y={y}>
            <HydraulicIndicator x={0} y={0} type="Y" />

            <text x={29} y={17} className="big-text align-left color-amber">N/W STEERING</text>
        </SvgGroup>
    ) : null;
};

const AntiSkid = ({ x, y }: ComponentPositionProps) => {
    const [antiSkidActive] = useSimVar('ANTISKID BRAKES ACTIVE', 'Bool', maxStaleness);

    return !antiSkidActive ? (
        <SvgGroup x={x} y={y}>
            {/* <!-- Text --> */}
            <text x={0} y={0} className="big-text color-amber">ANTI SKID</text>

            {/* <!-- Brake and Steering Control Units --> */}
            <path className="shape color-gray" d="m 76 5 h 20 v -25" />
            <text className="big-text color-green" x={86} y={0}>1</text>

            <path className="shape color-gray" d="m 103 5 h 20 v -25" />
            <text className="big-text color-green" x={113} y={0}>2</text>
        </SvgGroup>
    ) : null;
};

const LandingGearCtl = ({ x, y }: ComponentPositionProps) => {
    const [landingGearLeft] = useSimVar('GEAR LEFT POSITION', 'Percent Over 100', maxStaleness);
    const [landingGearCenter] = useSimVar('GEAR CENTER POSITION', 'Percent Over 100', maxStaleness);
    const [landingGearRight] = useSimVar('GEAR RIGHT POSITION', 'Percent Over 100', maxStaleness);

    const landingGearInTransit = landingGearLeft > 0 && landingGearLeft < 1
        || landingGearCenter > 0 && landingGearCenter < 1 || landingGearRight > 0 && landingGearRight < 1;

    return landingGearInTransit ? (
        <text id="center-lg-ctl" x={x} y={y} className="big-text align-left color-amber">L/G CTL</text>
    ) : null;
};

const NormalBraking = ({ x, y }: ComponentPositionProps) => {
    const hydraulics = useHydraulics();

    return !hydraulics.G.available ? (
        <SvgGroup x={x} y={y}>
            <HydraulicIndicator x={0} y={0} type="G" />

            <text x={86} y={18} className="big-text color-amber">NORM BRK</text>
        </SvgGroup>
    ) : null;
};

const AlternateBraking = ({ x, y }: ComponentPositionProps) => {
    const hydraulics = useHydraulics();

    return !hydraulics.G.available ? (
        <SvgGroup x={x} y={y}>
            <HydraulicIndicator x={0} y={0} type="Y" />

            <text x={86} y={18} className="big-text color-green">ALTN BRK</text>
            <AccumulatorOnly x={45} y={28} />
        </SvgGroup>
    ) : null;
};

const AccumulatorOnly = ({ x, y }: ComponentPositionProps) => (
    <SvgGroup x={x} y={y} className="shape color-green">
        {/* <!-- Arrow --> */}
        <polygon points="0,0 8,0 4,-6" />
        <path d="m 4 0 v 9 h 12" />

        <text x={84} y={18} className="big-text color-green">ACCU ONLY</text>
    </SvgGroup>
);

const AutoBrake = ({ x, y }: ComponentPositionProps) => {
    const [eng1] = useSimVar('ENG COMBUSTION:1', 'Bool');
    const [eng2] = useSimVar('ENG COMBUSTION:2', 'Bool');
    const available = eng1 === 1 && eng2 === 1;

    const [autoBrakeLevel] = useSimVar('L:A32NX_AUTOBRAKES_ARMED_MODE', 'Number', maxStaleness);

    return autoBrakeLevel !== 0 ? (
        <SvgGroup x={x} y={y}>
            <text className={`big-text color-${available ? 'green' : 'amber'}`}>AUTO BRK</text>

            <SvgGroup x={0} y={24}>
                { autoBrakeLevel === 1 ? <AutoBrakeLevel text="LO" available={available} /> : null }
                { autoBrakeLevel === 2 ? <AutoBrakeLevel text="MED" available={available} /> : null }
                { autoBrakeLevel === 3 ? <AutoBrakeLevel text="MAX" available={available} /> : null }
            </SvgGroup>
        </SvgGroup>
    ) : null;
};

interface AutoBrakeLevelProps {
    text: string,
    available: boolean,
}

const AutoBrakeLevel = ({ text, available }: AutoBrakeLevelProps) => <text className={`big-text color-${available ? 'green' : 'amber'}`}>{text}</text>;

const GearDoorJoint = ({ x, y }: ComponentPositionProps) => (
    <ellipse className="gear-door-joint" cx={x} cy={y} rx={2.6} ry={2.6} />
);

type GearLocation = 'left' | 'center' | 'right';

interface GearDoorProps extends ComponentPositionProps {
    location: GearLocation,
    inTransit: boolean,
}

const GearDoor = ({ x, y, location, inTransit }: GearDoorProps) => {
    if (location === 'center') {
        return (
            <SvgGroup x={x} y={y}>
                <path className="gear-door-side-line" d="m 0 0 h 13.41" />
                <path className="gear-door-side-line" d="m 111.31 0 h 13.41" />

                {inTransit
                    ? (
                        <>
                            <line className="gear-door-in-transit-line" x1={15.73} x2={9.73} y1={3} y2={27.16} />
                            <line className="gear-door-in-transit-line" x1={108.04} x2={114.04} y1={3} y2={27.16} />
                        </>
                    )
                    : (
                        <>
                            <line className="gear-door-line" x1={19.48} x2={48.12} y1={0} y2={0} />
                            <line className="gear-door-line" x1={73.58} x2={104.22} y1={0} y2={0} />
                        </>
                    )}

                <GearDoorJoint x={15.73} y={0} />
                <GearDoorJoint x={108.04} y={0} />
            </SvgGroup>
        );
    }
    return (
        <SvgGroup x={x} y={y}>
            <path className="gear-door-side-line" d="m0 0 h17.91" />
            <path className="gear-door-side-line" d="m106.43 0 h17.91" />

            {inTransit
                ? <line className="gear-door-in-transit-line" x1={location === 'left' ? 103.01 : 21.69} x2={location === 'left' ? 112.33 : 12.37} y1={3} y2={70} />
                : <line className="gear-door-line" x1={23.35} x2={100.5} y1={0} y2={0} />}

            <GearDoorJoint x={location === 'left' ? 103.01 : 21.13} y={0} />
        </SvgGroup>
    );
};

interface LandingGearPositionIndicatorsProps extends ComponentPositionProps {
    inTransit: boolean,
}

const LandingGearPositionIndicators = ({ x, y, inTransit }: LandingGearPositionIndicatorsProps) => (
    <SvgGroup x={x} y={y} className="gear-lgcius">
        <g className={`shape gear-lgciu-1 color-${!inTransit ? 'green' : 'red'}`}>
            <polygon points="0,0 22,0 22,29" />
            <path d="m 6 0 v 8" />
            <path d="m 11 0 v 14" />
            <path d="m 16.5 0 v 22" />
        </g>

        <g className={`shape gear-lgciu-2 color-${!inTransit ? 'green' : 'red'}`}>
            <polygon points="30,0 52,0 30,29" />
            <path d="m 36 0 v 22" />
            <path d="m 41 0 v 14" />
            <path d="m 46 0 v 8" />
        </g>
        <g className="shape gear-failed-lgicu-1">
            <path d="m 0 0 h 22" />

            <text className="gear-failed-lgciu-xx" x={13} y={16} fontSize={17}>XX</text>
        </g>

        <g className="shape gear-failed-lgicu-2">
            <path d="m 30 0 h 22" />

            <text className="gear-failed-lgciu-xx" x={39} y={16} fontSize={17}>XX</text>
        </g>
    </SvgGroup>
);

interface GearProps extends ComponentPositionProps {
    location: GearLocation
}

const Gear = ({ x, y, location }: GearProps) => {
    const [landingGearPosition] = useSimVar(`GEAR ${location.toUpperCase()} POSITION`, 'Percent Over 100', maxStaleness);

    const [status, setStatus] = useState({
        inTransit: false,
        positionIndicatorVisible: false,
    });

    useEffect(() => {
        const isUp = landingGearPosition === 0;
        const isDown = landingGearPosition === 1;

        setStatus({
            inTransit: !isDown && !isUp && ((landingGearPosition >= 0.1 && landingGearPosition <= 0.9) || status.inTransit),
            positionIndicatorVisible: !isUp && (landingGearPosition >= 0.1 || status.positionIndicatorVisible),
        });
    }, [landingGearPosition, status.inTransit, status.positionIndicatorVisible]);

    return (
        <g transform="scale(1.1)">
            <SvgGroup x={x} y={y}>
                <GearDoor x={0} y={0} location={location} inTransit={status.inTransit} />
                { status.positionIndicatorVisible ? <LandingGearPositionIndicators x={35} y={7} inTransit={status.inTransit} /> : null }
            </SvgGroup>
        </g>
    );
};

interface WheelArchProps extends ComponentPositionProps {
    type: 'top' | 'bottom',
    green?: boolean,
    amber?: boolean
}

const WheelArch = ({ x, y, type, green, amber }: WheelArchProps) => {
    const classes = classNames('wheel-set-brake-arch', { green: green && !amber }, { amber });

    if (type === 'top') {
        // eslint-disable-next-line max-len
        return <path className={classes} strokeLinecap="round" d={`m${x} ${y}c-5.6511 0.0126-11.216 1.6606-15.547 4.4688-3.4807 2.2398-5.759 5.205-6.3809 8.4629l1.4258 0.27149c0.52976-2.7753 2.5075-5.4347 5.7422-7.5156v-2e-3h2e-3c4.0708-2.6394 9.3921-4.2224 14.762-4.2344 5.3729-0.0113 10.936 1.5183 15.041 4.0859 3.2313 2.0193 5.2676 4.6167 5.8984 7.3418l1.4121-0.32617c-0.73917-3.193-3.0677-6.0756-6.541-8.2461v2e-3c-4.382-2.741-10.167-4.3204-15.815-4.3086z`} />;
    }

    // eslint-disable-next-line max-len
    return <path className={classes} stroke="#dadadf" strokeLinecap="round" d={`m${x} ${y}c-5.6511-0.01-11.216-1.3106-15.547-3.5268-3.4807-1.7678-5.759-4.1079-6.3809-6.6791l1.4258-0.21427c0.52976 2.1903 2.5075 4.2892 5.7422 5.9315v2e-3h2e-3c4.0708 2.0831 9.3921 3.3324 14.762 3.3419 5.3729 9e-3 10.936-1.1982 15.041-3.2247 3.2313-1.5937 5.2676-3.6436 5.8984-5.7944l1.4121 0.25743c-0.73917 2.52-3.0677 4.795-6.541 6.508v-2e-3c-4.382 2.1632-10.167 3.4098-15.815 3.4005z`} />;
};

interface Brake {
    number: number,
    temperature: number,
    hottest: boolean
}

interface WheelsProps extends ComponentPositionProps {
    left: Brake,
    right: Brake,
}

const Wheels = ({ x, y, left, right }: WheelsProps) => {
    const brakeAmberThreshold = 300;

    return (
        <SvgGroup x={x} y={y}>
            <WheelArch x={40} y={60} type="top" green={left.hottest && left.temperature > 100} amber={left.hottest && left.temperature > 300} />
            <WheelArch x={138} y={60} type="top" green={right.hottest && right.temperature > 100} amber={right.hottest && right.temperature > 300} />

            <WheelArch x={40} y={227} type="bottom" />
            <WheelArch x={138} y={227} type="bottom" />

            <text className="wheel-set-brake-celsius-marker" x={73} y={57}>°C</text>
            <text className="wheel-set-brake-rel-marker" x={77} y={81}>REL</text>

            <text className={`wheel-set-brake-temp${left.temperature > brakeAmberThreshold ? '-amber' : ''}`} x={51} y={59}>{Math.max(0, Math.round(left.temperature / 5) * 5)}</text>
            <text className={`wheel-set-brake-temp${right.temperature > brakeAmberThreshold ? '-amber' : ''}`} x={134} y={59}>{Math.max(0, Math.round(right.temperature / 5) * 5)}</text>

            <text className="wheel-set-brake-number" x={33} y={81}>{left.number}</text>
            <text className="wheel-set-brake-number" x={116} y={81}>{right.number}</text>
        </SvgGroup>
    );
};

ReactDOM.render(<SimVarProvider><WheelPage /></SimVarProvider>, getRenderTarget());
