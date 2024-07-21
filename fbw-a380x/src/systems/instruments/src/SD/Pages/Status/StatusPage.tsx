import React from 'react';
import FormattedFwcText from '../../../Common/EcamMessages/EWDMessageParser';
import { Infos, InopSys } from '../../../Common/EcamMessages';
import { PageTitle } from '../Generic/PageTitle';
import { StatusTitle } from 'instruments/src/SD/Pages/Status/elements/StatusTitle';
import { useSimVarList } from '@flybywiresim/fbw-sdk';

const padEWDCode = (code: number) => code.toString().padStart(9, '0');

export const StatusPage: React.FC = () => {
    const infoLineSimvars: string[] = [];
    const infoLineUnits: string[] = [];
    [...Array(5).keys()].forEach((v) => {
        infoLineSimvars.push(`L:A32NX_SD_STATUS_INFO_LINE_${v+1}`);
        infoLineUnits.push('number');
    })
    const [infos] : [number[], (arg0: number) => void] = useSimVarList(infoLineSimvars, infoLineUnits, 1000);

    const inopAllPhasesLineSimvars: string[] = [];
    const inopApprLdgLineSimvars: string[] = [];
    const inopLineUnits: string[] = [];
    [...Array(10).keys()].forEach((v) => {
        inopAllPhasesLineSimvars.push(`L:A32NX_SD_STATUS_INOP_ALL_LINE_${v+1}`);
        inopApprLdgLineSimvars.push(`L:A32NX_SD_STATUS_INOP_LDG_LINE_${v+1}`);
        inopLineUnits.push('number');
    })
    const [inopAllPhases] : [number[], (arg0: number) => void] = useSimVarList(inopAllPhasesLineSimvars, inopLineUnits, 1000);
    const [inopApprLdg] : [number[], (arg0: number) => void] = useSimVarList(inopApprLdgLineSimvars, inopLineUnits, 1000);
    const maxInopLines = Math.max(inopAllPhases.filter((v) => v).length, inopApprLdg.filter((v) => v).length);

    return (
        <>
            <PageTitle x={6} y={29}>STATUS</PageTitle>
            <g transform='translate(6 60)'>
                <StatusTitle x={378} y={2}>LIMITATIONS</StatusTitle>
                <FormattedFwcText x={0} y={50} message={'\x1b<5mNOT AVAIL'} />
            </g>
            <g transform='translate(6 120)'>
                <StatusTitle x={378} y={2} separatorLineWidth={335}>INFO</StatusTitle>
                {infos.map((v, idx) => Infos[padEWDCode(v)] && <FormattedFwcText x={0} y={idx * 30 + 40} message={Infos[padEWDCode(v)]} />)}
            </g>
            <g transform='translate(6 300)'>
                <StatusTitle x={378} y={2} separatorLineWidth={300}>INOP SYS</StatusTitle>
                <text x={190} y={40} className='F26 White MiddleAlign'>ALL PHASES</text>
                <text x={567} y={40} className='F26 White MiddleAlign'>APPR & LDG</text>
                <line x1={378} y1={30} x2={378} y2={25 + 30 * (maxInopLines + 1)} style={{ stroke: 'white', strokeWidth: 2 }} />
                {inopAllPhases.map((v, idx) => InopSys[padEWDCode(v)] && <FormattedFwcText x={0} y={idx * 30 + 80} message={InopSys[padEWDCode(v)]} />)}
                {inopApprLdg.map((v, idx) => InopSys[padEWDCode(v)] && <FormattedFwcText x={410} y={idx * 30 + 80} message={InopSys[padEWDCode(v)]} />)}
            </g>
        </>
    );
}
