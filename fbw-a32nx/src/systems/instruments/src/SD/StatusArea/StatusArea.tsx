import './StatusArea.scss';
import React, { useEffect, useState } from 'react';
import { useGlobalVar, useSimVar } from '@instruments/common/simVars';
import { getSupplier } from '@instruments/common/utils';
import { useArinc429Var } from '@instruments/common/arinc429';
import { NXLogicConfirmNode, NXLogicMemoryNode } from '@instruments/common/NXLogic';
import { useUpdate } from '@instruments/common/hooks';
import { NXUnits } from '@instruments/common/NXUnits';
import { Text } from '../Text/Text';

export const StatusArea = () => {
    const [gwDisplayedValue, setGwDisplayedValue] = useState('0');

    const [gwDisplayedUnit, setGwDisplayedUnit] = useState('kg');

    const zulu = useGlobalVar('ZULU TIME', 'seconds', 10000);

    const [airDataSwitch] = useSimVar('L:A32NX_AIR_DATA_SWITCHING_KNOB', 'enum', 200);
    const [attHdgSwitch] = useSimVar('L:A32NX_ATT_HDG_SWITCHING_KNOB', 'enum', 200);

    const [eng1Running] = useSimVar('ENG COMBUSTION:1', 'bool', 1000);
    const [eng2Running] = useSimVar('ENG COMBUSTION:2', 'bool', 1000);

    const [isaVisible, setIsaVisible] = useState(false);

    const [airDataReferenceSource, setAirDataSource] = useState(0);
    const [inertialReferenceSource, setInertialSource] = useState(0);
    const [loadFactorVisibleElement, setLoadFactorVisibleElement] = useState(false);
    const [loadFactorText, setLoadFactorText] = useState('');

    const sat = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_STATIC_AIR_TEMPERATURE`, 6000);
    const tat = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_TOTAL_AIR_TEMPERATURE`, 6000);
    const isa = useArinc429Var(`L:A32NX_ADIRS_ADR_${airDataReferenceSource}_INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA`, 6000);
    const loadFactor = useArinc429Var(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_BODY_NORMAL_ACC`, 300);

    const [loadFactorSet] = useState(new NXLogicConfirmNode(2));
    const [loadFactorReset] = useState(new NXLogicConfirmNode(5));
    const [loadFactorVisible] = useState(new NXLogicMemoryNode());

    useEffect(() => {
        setAirDataSource(getSupplier(undefined, airDataSwitch));
    }, [airDataSwitch]);

    useEffect(() => {
        setInertialSource(getSupplier(undefined, attHdgSwitch));
    }, [attHdgSwitch]);

    useUpdate((deltaTime) => {
        const conditionsMet = loadFactor.value > 1.4 || loadFactor.value < 0.7;
        const loadFactorSetValue = loadFactorSet.write(conditionsMet && loadFactor.isNormalOperation(), deltaTime);
        const loadFactorResetValue = loadFactorReset.write(!conditionsMet || !loadFactor.isNormalOperation(), deltaTime);
        const flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');

        setLoadFactorVisibleElement(
            flightPhase >= 4
            && flightPhase <= 8
            && loadFactorVisible.write(loadFactorSetValue, loadFactorResetValue),
        );

        let loadFactorText = 'XX';
        if (loadFactor.isNormalOperation()) {
            const clamped = Math.min(Math.max(loadFactor.value, -3), 5);
            loadFactorText = (clamped >= 0 ? '+' : '') + clamped.toFixed(1);
        }
        setLoadFactorText(loadFactorText);
    });

    useEffect(() => {
        const baroMode = SimVar.GetSimVarValue('L:XMLVAR_Baro1_Mode', 'number');
        const isInStdMode = baroMode !== 0 && baroMode !== 1;
        // As ISA relates to SAT, we cannot present ISA when SAT is unavailable. We might want to move this into
        // Rust ADIRS code itself.
        const isaShouldBeVisible = isInStdMode && isa.isNormalOperation() && sat.isNormalOperation();
        setIsaVisible(isaShouldBeVisible);
    }, [isa, sat]);

    const satPrefix = sat.value > 0 ? '+' : '';
    const tatPrefix = tat.value > 0 ? '+' : '';
    const seconds = Math.floor(zulu);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - (hours * 3600)) / 60);
    const padMinutes = String(minutes).padStart(2, '0');
    const padHours = String(hours).padStart(2, '0');

    const getPayloadWeight = (payloadCount: number) => {
        let payloadWeight = 0;
        for (let i = 1; i <= payloadCount; i++) {
            payloadWeight += SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${i}`, 'kg');
        }
        return payloadWeight;
    };

    useUpdate((_deltaTime) => {
        const fuelWeight = SimVar.GetSimVarValue('FUEL TOTAL QUANTITY WEIGHT', 'kg');
        const emptyWeight = SimVar.GetSimVarValue('EMPTY WEIGHT', 'kg');
        const payloadCount = SimVar.GetSimVarValue('PAYLOAD STATION COUNT', 'number');

        const gwUnit = NXUnits.userWeightUnit();
        const payloadWeight = getPayloadWeight(payloadCount);
        const gw = Math.round(NXUnits.kgToUser(emptyWeight + fuelWeight + payloadWeight));

        if (eng1Running || eng2Running && gw != null) {
            // Lower EICAS displays GW in increments of 100
            setGwDisplayedValue((Math.floor(gw / 100) * 100).toString());
        } else {
            setGwDisplayedValue('--');
        }
        setGwDisplayedUnit(gwUnit);
    });

    return (
        <div id="StatusArea">
            <svg viewBox="0 0 600 150" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <path className="sd-status-line" d="M 0   40 h 600" />
                    <path className="sd-status-line" d="M 200 40 v 125" />
                    <path className="sd-status-line" d="M 400 40 v 125" />

                    {/* Temperatures */}

                    <Text title x={74} y={63} alignEnd>
                        TAT
                    </Text>
                    { !tat.isNormalOperation()
                        ? (
                            <Text warning x={130} y={63} alignEnd>
                                XX
                            </Text>
                        )
                        : (
                            <Text value x={130} y={63} alignEnd>
                                {tatPrefix}
                                {Math.round(tat.value)}
                            </Text>
                        )}
                    <Text unit x={150} y={63} alignStart>
                        &#176;C
                    </Text>

                    <Text title x={74} y={87} alignEnd>
                        SAT
                    </Text>
                    { !sat.isNormalOperation()
                        ? (
                            <Text warning x={130} y={87} alignEnd>
                                XX
                            </Text>
                        )
                        : (
                            <Text value x={130} y={87} alignEnd>
                                {satPrefix}
                                {Math.round(sat.value)}
                            </Text>
                        )}
                    <Text unit x={150} y={87} alignStart>
                        &#176;C
                    </Text>

                    {/* Time */}

                    <Text bigValue x={287} y={87} alignEnd>{padHours}</Text>
                    <Text unit x={300} y={87}>H</Text>
                    <Text value x={317} y={87} alignStart>{padMinutes}</Text>

                    {/* Gross weight */}
                    {(eng1Running || eng2Running) && (
                        <>
                            <Text title x={445} y={63} alignEnd>
                                GW
                            </Text>
                            <Text value x={512} y={63}>
                                {gwDisplayedValue}
                            </Text>
                            <Text unit x={562} y={61} alignStart>
                                {gwDisplayedUnit}
                            </Text>
                        </>
                    )}

                    {!eng1Running && !eng2Running && (
                        <>
                            <Text title x={445} y={63} alignEnd>
                                GW
                            </Text>
                            <Text unit x={512} y={63}>
                                {gwDisplayedValue}
                            </Text>
                            <Text unit x={562} y={61} alignStart>
                                {gwDisplayedUnit}
                            </Text>
                        </>
                    )}

                    {/* ISA */}
                    {isaVisible && (
                        <>
                            <Text title x={74} y={111} alignEnd>ISA</Text>
                            <Text value x={130} y={111} alignEnd>{Math.round(isa.value)}</Text>
                            <Text unit x={150} y={111} alignStart>&#176;C</Text>
                        </>

                    )}

                    {loadFactorVisibleElement && (
                        <g id="LoadFactor">
                            <Text warning x={207} y={64} alignStart>G LOAD</Text>
                            <Text warning x={392} y={64} alignEnd>{loadFactorText}</Text>
                        </g>
                    )}
                </g>
            </svg>
        </div>
    );
};
