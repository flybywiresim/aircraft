import classNames from 'classnames';
import React from 'react';
import ReactDOM from 'react-dom';
import { PageTitle } from '../../Common/PageTitle';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';

import './Wheel.scss';

setIsEcamPage('wheel_page');

const maxStaleness = 300;

const GearDoorJoint = ({ x, y }) => (
    <ellipse className="gear-door-joint" cx={x} cy={y} rx={2.6} ry={2.6} />
);

const GearDoor = ({ x, y, type }) => {
    const [landingGearPosition] = useSimVar(`GEAR ${type.toUpperCase()} POSITION`, 'Percent Over 100', maxStaleness);

    const inTransit = landingGearPosition >= 0.1 && landingGearPosition <= 0.9;

    if (type === 'center') {
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
                ? <line className="gear-door-in-transit-line" x1={type === 'left' ? 103.01 : 21.69} x2={type === 'left' ? 112.33 : 12.37} y1={3} y2={70} />
                : <line className="gear-door-line" x1={23.35} x2={100.5} y1={0} y2={0} />}

            <GearDoorJoint x={type === 'left' ? 103.01 : 21.13} y={0} />
        </SvgGroup>
    );
};

const LandingGearPositionIndicators = ({ x, y, type }) => {
    const [landingGearPosition] = useSimVar(`GEAR ${type.toUpperCase()} POSITION`, 'Percent Over 100', maxStaleness);

    const isDown = landingGearPosition === 1;
    const isUp = landingGearPosition === 0;

    // x = 97
    // y = 278
    return !isUp ? (
        <SvgGroup x={x} y={y} className="gear-lgcius">
            <g className={`shape gear-lgciu-1 color-${isDown ? 'green' : 'red'}`}>
                <polygon points="0,0 22,0 22,29" />
                <path d="m 6 0 v 8" />
                <path d="m 11 0 v 14" />
                <path d="m 16.5 0 v 22" />
            </g>

            <g className={`shape gear-lgciu-2 color-${isDown ? 'green' : 'red'}`}>
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
    ) : null;
};

export const WheelPage = () => {
    const [brake1] = useSimVar('L:A32NX_REPORTED_BRAKE_TEMPERATURE_1', 'Celsius', maxStaleness);
    const [brake2] = useSimVar('L:A32NX_REPORTED_BRAKE_TEMPERATURE_2', 'Celsius', maxStaleness);
    const [brake3] = useSimVar('L:A32NX_REPORTED_BRAKE_TEMPERATURE_3', 'Celsius', maxStaleness);
    const [brake4] = useSimVar('L:A32NX_REPORTED_BRAKE_TEMPERATURE_4', 'Celsius', maxStaleness);

    return (
        <EcamPage name="main-wheel">
            <PageTitle x={6} y={115} text="WHEEL" />

            {/* TODO: Use F/CTL page component */}
            <g id="speedbrakes">
                <path className="shape color-green" d="m 103 84 l 15 0" />
                <path className="shape color-green" d="m 142 79 l 15 0" />
                <path className="shape color-green" d="m 180 74 l 15 0" />
                <path className="shape color-green" d="m 219 69 l 15 0" />
                <path className="shape color-green" d="m 257 64 l 15 0" />

                <path className="shape color-green" d="m 497 84 l -15 0" />
                <path className="shape color-green" d="m 458 79 l -15 0" />
                <path className="shape color-green" d="m 420 74 l -15 0" />
                <path className="shape color-green" d="m 381 69 l -15 0" />
                <path className="shape color-green" d="m 343 64 l -15 0" />
            </g>

            <NoseWheelSteering x={205} y={200} />
            <LandingGearCtl x={255} y={263} />
            <AntiSkid x={300} y={312} />

            <NormalBraking x={220} y={333} />
            <AlternateBraking x={220} y={360} />

            <AutoBrake x={300} y={460} />

            {/* <!-- LG indicators --> */}

            {/* <!-- Left gear --> */}
            <g id="gear-left" className="blinking-gear">
                <GearDoor x={62.06} y={271.07} type="left" />
                <LandingGearPositionIndicators x={97} y={278} type="left" />
            </g>

            {/* <!-- Center gear --> */}
            <g id="gear-center" className="blinking-gear">
                <GearDoor x={232.38} y={133.91} type="center" />
                <LandingGearPositionIndicators x={267} y={140} type="center" />

                <g id="center-brake-arches">
                    {/* eslint-disable-next-line max-len */}
                    <path className="wheel-set-brake-arch" strokeWidth="2" d="m352.97 10.47c-5.6511-0.01-11.216-1.3106-15.547-3.5268-3.4807-1.7678-5.759-4.1079-6.3809-6.6791l1.4258-0.21427c0.52976 2.1903 2.5075 4.2892 5.7422 5.9315v2e-3h2e-3c4.0708 2.0831 9.3921 3.3324 14.762 3.3419 5.3729 9e-3 10.936-1.1982 15.041-3.2247 3.2313-1.5937 5.2676-3.6436 5.8984-5.7944l1.4121 0.25743c-0.73917 2.52-3.0677 4.795-6.541 6.508v-2e-3c-4.382 2.1632-10.167 3.4098-15.815 3.4005z" />
                    {/* eslint-disable-next-line max-len */}
                    <path className="wheel-set-brake-arch" strokeWidth="2" d="m249.97 10.47c-5.6511-0.01-11.216-1.3106-15.547-3.5268-3.4807-1.7678-5.759-4.1079-6.3809-6.6791l1.4258-0.21427c0.52976 2.1903 2.5075 4.2892 5.7422 5.9315v2e-3h2e-3c4.0708 2.0831 9.392 3.3324 14.762 3.3419 5.3729 9e-3 10.936-1.1982 15.041-3.2247 3.2313-1.5937 5.2676-3.6436 5.8984-5.7944l1.4121 0.25743c-0.73917 2.52-3.0677 4.795-6.541 6.508v-2e-3c-4.382 2.1632-10.167 3.4098-15.814 3.4005z" />
                </g>
            </g>

            {/* <!-- Right gear --> */}
            <g id="gear-right" className="blinking-gear">
                <GearDoor x={410.24} y={271.07} type="right" />
                <LandingGearPositionIndicators x={445} y={278} type="right" />
            </g>

            {/* <!-- Brake temperatures --> */}

            {/* <!-- Wheel set #1 --> */}
            <g id="wheel-set-brake-left">
                {/* <!-- Arches --> */}
                {/* eslint-disable-next-line max-len */}
                <path id="indicator-arch-1" className="wheel-set-brake-arch" strokeLinecap="round" d="m12.25 372.69c-5.6511 0.0126-11.216 1.6606-15.547 4.4688-3.4807 2.2398-5.759 5.205-6.3809 8.4629l1.4258 0.27149c0.52976-2.7753 2.5075-5.4347 5.7422-7.5156v-2e-3h2e-3c4.0708-2.6394 9.3921-4.2224 14.762-4.2344 5.3729-0.0113 10.936 1.5183 15.041 4.0859 3.2313 2.0193 5.2676 4.6167 5.8984 7.3418l1.4121-0.32617c-0.73917-3.193-3.0677-6.0756-6.541-8.2461v2e-3c-4.382-2.741-10.167-4.3204-15.815-4.3086z" />
                {/* eslint-disable-next-line max-len */}
                <path id="indicator-arch-2" className="wheel-set-brake-arch" strokeLinecap="round" d="m110 372.69c-5.6511 0.0126-11.216 1.6606-15.547 4.4688-3.4807 2.2398-5.759 5.205-6.3809 8.4629l1.4258 0.27149c0.52976-2.7753 2.5075-5.4347 5.7422-7.5156v-2e-3h2e-3c4.0708-2.6394 9.3921-4.2224 14.762-4.2344 5.3729-0.0113 10.936 1.5183 15.041 4.0859 3.2313 2.0193 5.2676 4.6167 5.8984 7.3418l1.4121-0.32617c-0.73917-3.193-3.0677-6.0756-6.541-8.2461v2e-3c-4.382-2.741-10.167-4.3205-15.814-4.3086z" />

                {/* eslint-disable-next-line max-len */}
                <path className="wheel-set-brake-arch" stroke="#dadadf" strokeLinecap="round" d="m12.25 540.47c-5.6511-0.01-11.216-1.3106-15.547-3.5268-3.4807-1.7678-5.759-4.1079-6.3809-6.6791l1.4258-0.21427c0.52976 2.1903 2.5075 4.2892 5.7422 5.9315v2e-3h2e-3c4.0708 2.0831 9.3921 3.3324 14.762 3.3419 5.3729 9e-3 10.936-1.1982 15.041-3.2247 3.2313-1.5937 5.2676-3.6436 5.8984-5.7944l1.4121 0.25743c-0.73917 2.52-3.0677 4.795-6.541 6.508v-2e-3c-4.382 2.1632-10.167 3.4098-15.815 3.4005z" />
                {/* eslint-disable-next-line max-len */}
                <path className="wheel-set-brake-arch" stroke="#dadadf" strokeLinecap="round" d="m110 540.47c-5.6511-0.01-11.216-1.3106-15.547-3.5268-3.4807-1.7678-5.759-4.1079-6.3809-6.6791l1.4258-0.21427c0.52976 2.1903 2.5075 4.2892 5.7422 5.9315v2e-3h2e-3c4.0708 2.0831 9.392 3.3324 14.762 3.3419 5.3729 9e-3 10.936-1.1982 15.041-3.2247 3.2313-1.5937 5.2676-3.6436 5.8984-5.7944l1.4121 0.25743c-0.73917 2.52-3.0677 4.795-6.541 6.508v-2e-3c-4.382 2.1632-10.167 3.4098-15.814 3.4005z" />

                {/* <!-- Markers --> */}
                <text className="wheel-set-brake-celsius-marker" x="85" y="397">°C</text>
                <text className="wheel-set-brake-rel-marker" x="89" y="420">REL</text>

                {/* <!-- Temperatures --> */}
                <text id="wheel-brake-temp-1" className="wheel-set-brake-temp" x="65" y="398">xx</text>
                <text id="wheel-brake-temp-2" className="wheel-set-brake-temp" x="147" y="398">xx</text>

                {/* <!-- wheel numbers --> */}
                <text className="wheel-set-brake-number" x="45" y="420">1</text>
                <text className="wheel-set-brake-number" x="128" y="420">2</text>
            </g>

            {/* <!-- Wheel set #2 --> */}
            <g id="wheel-set-brake-right">
                {/* <!-- Arches --> */}
                {/* eslint-disable-next-line max-len */}
                <path id="indicator-arch-3" className="wheel-set-brake-arch" strokeLinecap="round" d="m510.13 372.69c-5.6511 0.0126-11.216 1.6606-15.547 4.4688-3.4807 2.2398-5.759 5.205-6.3809 8.4629l1.4258 0.27149c0.52976-2.7753 2.5075-5.4347 5.7422-7.5156v-2e-3h2e-3c4.0708-2.6394 9.3921-4.2224 14.762-4.2344 5.3729-0.0113 10.936 1.5183 15.041 4.0859 3.2313 2.0193 5.2676 4.6167 5.8984 7.3418l1.4121-0.32617c-0.73917-3.193-3.0677-6.0756-6.541-8.2461v2e-3c-4.382-2.741-10.167-4.3205-15.814-4.3086z" />
                {/* eslint-disable-next-line max-len */}
                <path id="indicator-arch-4" className="wheel-set-brake-arch" strokeLinecap="round" d="m608.43 372.69c-5.6511 0.0126-11.216 1.6606-15.547 4.4688-3.4807 2.2398-5.759 5.205-6.3809 8.4629l1.4258 0.27149c0.52976-2.7753 2.5075-5.4347 5.7422-7.5156v-2e-3h2e-3c4.0708-2.6394 9.3921-4.2224 14.762-4.2344 5.3729-0.0113 10.936 1.5183 15.041 4.0859 3.2313 2.0193 5.2676 4.6167 5.8984 7.3418l1.4121-0.32617c-0.73917-3.193-3.0677-6.0756-6.541-8.2461v2e-3c-4.382-2.741-10.167-4.3205-15.814-4.3086z" />

                {/* eslint-disable-next-line max-len */}
                <path className="wheel-set-brake-arch" stroke="#dadadf" strokeLinecap="round" d="m510.13 540.47c-5.6511-0.01-11.216-1.3106-15.547-3.5268-3.4807-1.7678-5.759-4.1079-6.3809-6.6791l1.4258-0.21427c0.52976 2.1903 2.5075 4.2892 5.7422 5.9315v2e-3h2e-3c4.0708 2.0831 9.392 3.3324 14.762 3.3419 5.3729 9e-3 10.936-1.1982 15.041-3.2247 3.2313-1.5937 5.2676-3.6436 5.8984-5.7944l1.4121 0.25743c-0.73917 2.52-3.0677 4.795-6.541 6.508v-2e-3c-4.382 2.1632-10.167 3.4098-15.814 3.4005z" />
                {/* eslint-disable-next-line max-len */}
                <path className="wheel-set-brake-arch" stroke="#dadadf" strokeLinecap="round" d="m608.43 540.47c-5.6511-0.01-11.216-1.3106-15.547-3.5268-3.4807-1.7678-5.759-4.1079-6.3809-6.6791l1.4258-0.21427c0.52976 2.1903 2.5075 4.2892 5.7422 5.9315v2e-3h2e-3c4.0708 2.0831 9.392 3.3324 14.762 3.3419 5.3729 9e-3 10.936-1.1982 15.041-3.2247 3.2313-1.5937 5.2676-3.6436 5.8984-5.7944l1.4121 0.25743c-0.73917 2.52-3.0677 4.795-6.541 6.508v-2e-3c-4.382 2.1632-10.167 3.4098-15.814 3.4005z" />

                {/* <!-- Markers --> */}
                <text className="wheel-set-brake-celsius-marker" x="510" y="397">°C</text>
                <text className="wheel-set-brake-rel-marker" x="515" y="420">REL</text>

                {/* <!-- Temperatures --> */}
                <text id="wheel-brake-temp-3" className="wheel-set-brake-temp" x="488" y="398">xx</text>
                <text id="wheel-brake-temp-4" className="wheel-set-brake-temp" x="572" y="398">xx</text>

                {/* <!-- Wheel numbers --> */}
                <text className="wheel-set-brake-number" x="470" y="420">3</text>
                <text className="wheel-set-brake-number" x="555" y="420">4</text>
            </g>
        </EcamPage>
    );
};

const NoseWheelSteering = ({ x, y }) => {
    const [antiSkidActive] = useSimVar('ANTISKID BRAKES ACTIVE', 'Bool', maxStaleness);

    return !antiSkidActive ? (
        <SvgGroup x={x} y={y}>
            {/* <!-- Hyd --> TODO Use HYD control from F/CTL. Show GREEN when it's okay. */}
            <rect className="hyd-background" x={0} y={0} width="18" height="20" />
            <text className="medium-text color-amber" x={9} y={10} textAnchor="middle" alignmentBaseline="central">Y</text>

            <text x={29} y={17} className="big-text align-left color-amber">N/W STEERING</text>
        </SvgGroup>
    ) : null;
};

const AntiSkid = ({ x, y }) => {
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

const LandingGearCtl = ({ x, y }) => {
    const [landingGearLeft] = useSimVar('GEAR LEFT POSITION', 'Percent Over 100', maxStaleness);
    const [landingGearCenter] = useSimVar('GEAR CENTER POSITION', 'Percent Over 100', maxStaleness);
    const [landingGearRight] = useSimVar('GEAR RIGHT POSITION', 'Percent Over 100', maxStaleness);

    const landingGearInTransit = landingGearLeft > 0 && landingGearLeft < 1
        || landingGearCenter > 0 && landingGearCenter < 1 || landingGearRight > 0 && landingGearRight < 1;

    return landingGearInTransit ? (
        <text id="center-lg-ctl" x={x} y={y} className="big-text align-left color-amber">L/G CTL</text>
    ) : null;
};

const NormalBraking = ({ x, y }) => {
    const [eng1] = useSimVar('ENG COMBUSTION:1', 'Bool');
    const [eng2] = useSimVar('ENG COMBUSTION:2', 'Bool');
    const available = eng1 === 1 && eng2 === 1;

    return !available ? (
        <SvgGroup x={x} y={y}>
            {/* <!-- Hyd --> TODO Use HYD control from F/CTL. Show GREEN when it's okay. */}
            <rect className="hyd-background" x={0} y={0} width="18" height="20" />
            <text className="medium-text color-amber" x={9} y={10} textAnchor="middle" alignmentBaseline="central">G</text>

            <text x={86} y={18} className="big-text color-amber">NORM BRK</text>
        </SvgGroup>
    ) : null;
};

const AlternateBraking = ({ x, y }) => {
    const [eng1] = useSimVar('ENG COMBUSTION:1', 'Bool');
    const [eng2] = useSimVar('ENG COMBUSTION:2', 'Bool');
    const available = eng1 === 1 && eng2 === 1;

    return !available ? (
        <SvgGroup x={x} y={y}>
            {/* <!-- Hyd --> TODO Use HYD control from F/CTL. Show GREEN when it's okay. */}
            <rect className="hyd-background" x={0} y={0} width="18" height="20" />
            <text className="medium-text color-amber" x={9} y={10} textAnchor="middle" alignmentBaseline="central">Y</text>

            <text x={86} y={18} className="big-text color-green">ALTN BRK</text>
            <AccumulatorOnly x={45} y={28} />
        </SvgGroup>
    ) : null;
};

const AccumulatorOnly = ({ x, y }) => (
    <SvgGroup x={x} y={y} className="shape color-green">
        {/* <!-- Arrow --> */}
        <polygon points="0,0 8,0 4,-6" />
        <path d="m 4 0 v 9 h 12" />

        <text x={84} y={18} className="big-text color-green">ACCU ONLY</text>
    </SvgGroup>
);

const AutoBrake = ({ x, y }) => {
    const [eng1] = useSimVar('ENG COMBUSTION:1', 'Bool');
    const [eng2] = useSimVar('ENG COMBUSTION:2', 'Bool');
    const available = eng1 === 1 && eng2 === 1;

    const [autoBrakeLevel] = useSimVar('L:XMLVAR_Autobrakes_Level', 'Number', maxStaleness);

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

const AutoBrakeLevel = ({ text, available }) => <text className={`big-text color-${available ? 'green' : 'amber'}`}>{text}</text>;

const EcamPage = ({ name, children }) => (
    <svg id={name} version="1.1" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

interface SvgGroupProps {
    x: number,
    y: number,
    className?: string,
}
const SvgGroup: React.FunctionComponent<SvgGroupProps> = ({ x, y, className, children }) => <g className={className} transform={`translate(${x},${y})`}>{children}</g>;

ReactDOM.render(<SimVarProvider><WheelPage /></SimVarProvider>, getRenderTarget());
