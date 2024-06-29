// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AirplaneFill, CloudArrowDown } from 'react-bootstrap-icons';
import {
  CargoStationInfo,
  PaxStationInfo,
  SeatFlags,
  Units,
  usePersistentNumberProperty,
  usePersistentProperty,
  useSeatFlags,
  useSimVar,
} from '@flybywiresim/fbw-sdk';
import {
  setPayloadImported,
  setDisplayPaxMainDeck,
  t,
  useAppDispatch,
  TooltipWrapper,
  PromptModal,
  useModals,
  SelectGroup,
  SelectItem,
  Card,
  A380SeatOutlineBg,
  A380SeatOutlineUpperBg,
  useAppSelector,
} from '@flybywiresim/flypad';
import { BoardingInput, MiscParamsInput, PayloadInputTable } from '../PayloadElements';
import { CargoWidget } from './CargoWidget';
import { ChartWidget } from '../Chart/ChartWidget';
import { SeatMapWidget } from '../Seating/SeatMapWidget';
import { PayloadProps } from '../PayloadPage';

export const A380Payload: React.FC<PayloadProps> = ({
  airframeInfo,
  flypadInfo,
  cabinInfo,
  maxPax,
  maxCargo,
  simbriefUnits,
  simbriefBagWeight,
  simbriefPaxWeight,
  simbriefPax,
  simbriefBag,
  simbriefFreight,
  simbriefDataLoaded,
  payloadImported,
  massUnitForDisplay,
  isOnGround,
  boardingStarted,
  boardingRate,
  setBoardingStarted,
  setBoardingRate,
}) => {
  const { showModal } = useModals();

  const [mainFwdA] = useSeatFlags(`L:${cabinInfo.seatMap[0].simVar}`, cabinInfo.seatMap[0].capacity, 509);
  const [mainFwdB] = useSeatFlags(`L:${cabinInfo.seatMap[1].simVar}`, cabinInfo.seatMap[1].capacity, 521);
  const [mainMid1A] = useSeatFlags(`L:${cabinInfo.seatMap[2].simVar}`, cabinInfo.seatMap[2].capacity, 523);
  const [mainMid1B] = useSeatFlags(`L:${cabinInfo.seatMap[3].simVar}`, cabinInfo.seatMap[3].capacity, 541);
  const [mainMid1C] = useSeatFlags(`L:${cabinInfo.seatMap[4].simVar}`, cabinInfo.seatMap[4].capacity, 547);
  const [mainMid2A] = useSeatFlags(`L:${cabinInfo.seatMap[5].simVar}`, cabinInfo.seatMap[5].capacity, 557);
  const [mainMid2B] = useSeatFlags(`L:${cabinInfo.seatMap[6].simVar}`, cabinInfo.seatMap[6].capacity, 563);
  const [mainMid2C] = useSeatFlags(`L:${cabinInfo.seatMap[7].simVar}`, cabinInfo.seatMap[7].capacity, 569);
  const [mainAftA] = useSeatFlags(`L:${cabinInfo.seatMap[8].simVar}`, cabinInfo.seatMap[8].capacity, 571);
  const [mainAftB] = useSeatFlags(`L:${cabinInfo.seatMap[9].simVar}`, cabinInfo.seatMap[9].capacity, 577);
  const [upperFwd] = useSeatFlags(`L:${cabinInfo.seatMap[10].simVar}`, cabinInfo.seatMap[10].capacity, 587);
  const [upperMidA] = useSeatFlags(`L:${cabinInfo.seatMap[11].simVar}`, cabinInfo.seatMap[11].capacity, 593);
  const [upperMidB] = useSeatFlags(`L:${cabinInfo.seatMap[12].simVar}`, cabinInfo.seatMap[12].capacity, 599);
  const [upperAft] = useSeatFlags(`L:${cabinInfo.seatMap[13].simVar}`, cabinInfo.seatMap[13].capacity, 601);

  const [mainFwdADesired, setMainFwdADesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[0].simVar}_DESIRED`,
    cabinInfo.seatMap[0].capacity,
    317,
  );
  const [mainFwdBDesired, setMainFwdBDesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[1].simVar}_DESIRED`,
    cabinInfo.seatMap[1].capacity,
    347,
  );
  const [mainMid1ADesired, setMainMid1ADesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[2].simVar}_DESIRED`,
    cabinInfo.seatMap[2].capacity,
    359,
  );
  const [mainMid1BDesired, setMainMid1BDesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[3].simVar}_DESIRED`,
    cabinInfo.seatMap[3].capacity,
    379,
  );
  const [mainMid1CDesired, setMainMid1CDesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[4].simVar}_DESIRED`,
    cabinInfo.seatMap[4].capacity,
    397,
  );
  const [mainMid2ADesired, setMainMid2ADesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[5].simVar}_DESIRED`,
    cabinInfo.seatMap[5].capacity,
    421,
  );
  const [mainMid2BDesired, setMainMid2BDesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[6].simVar}_DESIRED`,
    cabinInfo.seatMap[6].capacity,
    439,
  );
  const [mainMid2CDesired, setMainMid2CDesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[7].simVar}_DESIRED`,
    cabinInfo.seatMap[7].capacity,
    457,
  );
  const [mainAftADesired, setMainAftADesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[8].simVar}_DESIRED`,
    cabinInfo.seatMap[8].capacity,
    479,
  );
  const [mainAftBDesired, setMainAftBDesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[9].simVar}_DESIRED`,
    cabinInfo.seatMap[9].capacity,
    499,
  );
  const [upperFwdDesired, setUpperFwdDesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[10].simVar}_DESIRED`,
    cabinInfo.seatMap[10].capacity,
    521,
  );
  const [upperMidADesired, setUpperMidADesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[11].simVar}_DESIRED`,
    cabinInfo.seatMap[11].capacity,
    541,
  );
  const [upperMidBDesired, setUpperMidBDesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[12].simVar}_DESIRED`,
    cabinInfo.seatMap[12].capacity,
    557,
  );
  const [upperAftDesired, setUpperAftDesired] = useSeatFlags(
    `L:${cabinInfo.seatMap[13].simVar}_DESIRED`,
    cabinInfo.seatMap[13].capacity,
    571,
  );

  const activeFlags = useMemo(
    () => [
      mainFwdA,
      mainFwdB,
      mainMid1A,
      mainMid1B,
      mainMid1C,
      mainMid2A,
      mainMid2B,
      mainMid2C,
      mainAftA,
      mainAftB,
      upperFwd,
      upperMidA,
      upperMidB,
      upperAft,
    ],
    [
      mainFwdA,
      mainFwdB,
      mainMid1A,
      mainMid1B,
      mainMid1C,
      mainMid2A,
      mainMid2B,
      mainMid2C,
      mainAftA,
      mainAftB,
      upperFwd,
      upperMidA,
      upperMidB,
      upperAft,
    ],
  );
  const desiredFlags = useMemo(
    () => [
      mainFwdADesired,
      mainFwdBDesired,
      mainMid1ADesired,
      mainMid1BDesired,
      mainMid1CDesired,
      mainMid2ADesired,
      mainMid2BDesired,
      mainMid2CDesired,
      mainAftADesired,
      mainAftBDesired,
      upperFwdDesired,
      upperMidADesired,
      upperMidBDesired,
      upperAftDesired,
    ],
    [
      mainFwdADesired,
      mainFwdBDesired,
      mainMid1ADesired,
      mainMid1BDesired,
      mainMid1CDesired,
      mainMid2ADesired,
      mainMid2BDesired,
      mainMid2CDesired,
      mainAftADesired,
      mainAftBDesired,
      upperFwdDesired,
      upperMidADesired,
      upperMidBDesired,
      upperAftDesired,
    ],
  );
  const setDesiredFlags = useMemo(
    () => [
      setMainFwdADesired,
      setMainFwdBDesired,
      setMainMid1ADesired,
      setMainMid1BDesired,
      setMainMid1CDesired,
      setMainMid2ADesired,
      setMainMid2BDesired,
      setMainMid2CDesired,
      setMainAftADesired,
      setMainAftBDesired,
      setUpperFwdDesired,
      setUpperMidADesired,
      setUpperMidBDesired,
      setUpperAftDesired,
    ],
    [],
  );

  const [fwdBag] = useSimVar(`L:${cabinInfo.cargoMap[0].simVar}`, 'Number', 619);
  const [aftBag] = useSimVar(`L:${cabinInfo.cargoMap[1].simVar}`, 'Number', 631);
  const [aftBulk] = useSimVar(`L:${cabinInfo.cargoMap[2].simVar}`, 'Number', 641);

  const [fwdBagDesired, setFwdBagDesired] = useSimVar(`L:${cabinInfo.cargoMap[0].simVar}_DESIRED`, 'Number', 607);
  const [aftBagDesired, setAftBagDesired] = useSimVar(`L:${cabinInfo.cargoMap[1].simVar}_DESIRED`, 'Number', 613);
  const [aftBulkDesired, setAftBulkDesired] = useSimVar(`L:${cabinInfo.cargoMap[2].simVar}_DESIRED`, 'Number', 617);

  const cargo = useMemo(() => [fwdBag, aftBag, aftBulk], [fwdBag, aftBag, aftBulk]);
  const cargoDesired = useMemo(
    () => [fwdBagDesired, aftBagDesired, aftBulkDesired],
    [fwdBagDesired, aftBagDesired, aftBulkDesired],
  );
  const setCargoDesired = useMemo(() => [setFwdBagDesired, setAftBagDesired, setAftBulkDesired], []);

  const [paxWeight, setPaxWeight] = useSimVar('L:A32NX_WB_PER_PAX_WEIGHT', 'Kilograms', 739);
  const [paxBagWeight, setPaxBagWeight] = useSimVar('L:A32NX_WB_PER_BAG_WEIGHT', 'Kilograms', 797);
  // const [destEfob] = useSimVar('L:A32NX_DESTINATION_FUEL_ON_BOARD', 'Kilograms', 5_000);

  const [emptyWeight] = useState(SimVar.GetSimVarValue('A:EMPTY WEIGHT', 'Kilograms'));

  const [seatMap] = useState<PaxStationInfo[]>(cabinInfo.seatMap);
  const [cargoMap] = useState<CargoStationInfo[]>(cabinInfo.cargoMap);

  // Calculate Total Pax from Pax Flags
  const totalPax = useMemo(() => {
    let p = 0;
    activeFlags.forEach((flag) => {
      p += flag.getTotalFilledSeats();
    });
    return p;
  }, [...activeFlags]);

  const totalPaxDesired = useMemo(() => {
    let p = 0;
    desiredFlags.forEach((flag) => {
      p += flag.getTotalFilledSeats();
    });
    return p;
  }, [...desiredFlags]);

  const totalCargoDesired = useMemo(
    () => (cargoDesired && cargoDesired.length > 0 ? cargoDesired.reduce((a, b) => a + b) : -1),
    [...cargoDesired],
  );
  const totalCargo = useMemo(() => (cargo && cargo.length > 0 ? cargo.reduce((a, b) => a + b) : -1), [...cargo]);

  // Units
  // Weights
  const [zfw] = useSimVar('L:A32NX_AIRFRAME_ZFW', 'number', 1_553);
  const [zfwDesired] = useSimVar('L:A32NX_AIRFRAME_ZFW_DESIRED', 'number', 1_621);
  const [gw] = useSimVar('L:A32NX_AIRFRAME_GW', 'number', 1_741);
  const [gwDesired] = useSimVar('L:A32NX_AIRFRAME_GW_DESIRED', 'number', 1_787);

  // CG MAC
  const [zfwCgMac] = useSimVar('L:A32NX_AIRFRAME_ZFW_CG_PERCENT_MAC', 'number', 1_223);
  const [desiredZfwCgMac] = useSimVar('L:A32NX_AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED', 'number', 1_279);
  const [gwCgMac] = useSimVar('L:A32NX_AIRFRAME_GW_CG_PERCENT_MAC', 'number', 1_301);
  const [desiredGwCgMac] = useSimVar('L:A32NX_AIRFRAME_GW_CG_PERCENT_MAC_DESIRED', 'number', 1_447);

  const [showSimbriefButton, setShowSimbriefButton] = useState(false);
  const [displayZfw, setDisplayZfw] = useState(true);

  const displayPaxMainDeck = useAppSelector((state) => state.payload.displayPaxMainDeck);

  // GSX
  const [gsxPayloadSyncEnabled] = usePersistentNumberProperty('GSX_PAYLOAD_SYNC', 0);
  const [_, setGsxNumPassengers] = useSimVar('L:FSDT_GSX_NUMPASSENGERS', 'Number', 223);
  const [gsxBoardingState] = useSimVar('L:FSDT_GSX_BOARDING_STATE', 'Number', 227);
  const [gsxDeBoardingState] = useSimVar('L:FSDT_GSX_DEBOARDING_STATE', 'Number', 229);
  const gsxInProgress = () =>
    (gsxDeBoardingState >= 4 && gsxDeBoardingState < 6) || (gsxBoardingState >= 4 && gsxBoardingState < 6);
  const gsxStates = {
    AVAILABLE: 1,
    NOT_AVAILABLE: 2,
    BYPASSED: 3,
    REQUESTED: 4,
    PERFORMING: 5,
    COMPLETED: 6,
  };

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (simbriefDataLoaded === true && payloadImported === false) {
      setSimBriefValues();
      dispatch(setPayloadImported(true));
    }
  }, []);

  const setSimBriefValues = () => {
    if (simbriefUnits === 'kgs') {
      setPaxBagWeight(simbriefBagWeight);
      setPaxWeight(simbriefPaxWeight);
      setTargetPax(simbriefPax > maxPax ? maxPax : simbriefPax);
      setTargetCargo(simbriefBag, simbriefFreight, simbriefBagWeight);
    } else {
      setPaxBagWeight(Units.poundToKilogram(simbriefBagWeight));
      setPaxWeight(Units.poundToKilogram(simbriefPaxWeight));
      setTargetPax(simbriefPax);
      setTargetCargo(simbriefBag, Units.poundToKilogram(simbriefFreight), Units.poundToKilogram(simbriefBagWeight));
    }
  };

  const [eng1Running] = useSimVar('ENG COMBUSTION:1', 'Bool', 6_581);
  const [eng4Running] = useSimVar('ENG COMBUSTION:4', 'Bool', 6_397);
  const [coldAndDark, setColdAndDark] = useState<boolean>(true);

  const chooseDesiredSeats = useCallback(
    (stationIndex: number, fillSeats: boolean = true, numChoose: number) => {
      const seatFlags: SeatFlags = desiredFlags[stationIndex];
      if (fillSeats) {
        seatFlags.fillEmptySeats(numChoose);
      } else {
        seatFlags.emptyFilledSeats(numChoose);
      }

      setDesiredFlags[stationIndex](seatFlags);
    },
    [...desiredFlags],
  );

  const setTargetPax = useCallback(
    (numOfPax: number) => {
      setGsxNumPassengers(numOfPax);

      if (numOfPax === totalPaxDesired || numOfPax > maxPax || numOfPax < 0) return;

      let paxRemaining = numOfPax;

      const fillStation = (stationIndex: number, percent: number, paxToFill: number) => {
        const sFlags: SeatFlags = desiredFlags[stationIndex];
        const toBeFilled = Math.min(Math.trunc(percent * paxToFill), seatMap[stationIndex].capacity);

        paxRemaining -= toBeFilled;

        const planSeatedPax = sFlags.getTotalFilledSeats();
        chooseDesiredSeats(stationIndex, toBeFilled > planSeatedPax, Math.abs(toBeFilled - planSeatedPax));
      };

      for (let i = seatMap.length - 1; i > 0; i--) {
        fillStation(
          i,
          parseFloat(Number((Math.ceil((seatMap[i].capacity / maxPax) * 1e2) / 1e2).toExponential(2)).toPrecision(3)),
          numOfPax,
        );
      }
      fillStation(0, 1, paxRemaining);
    },
    [maxPax, seatMap, totalPaxDesired],
  );

  const setTargetCargo = useCallback(
    (numberOfPax: number, freight: number, perBagWeight: number = paxBagWeight) => {
      const bagWeight = numberOfPax * perBagWeight;
      const loadableCargoWeight = Math.min(bagWeight + Math.round(freight), maxCargo);

      let remainingWeight = loadableCargoWeight;

      function fillCargo(station: number, percent: number, loadableCargoWeight: number) {
        const c = Math.round(percent * loadableCargoWeight);
        remainingWeight -= c;
        setCargoDesired[station](c);
      }

      for (let i = cargoDesired.length - 1; i > 0; i--) {
        fillCargo(i, cargoMap[i].weight / maxCargo, loadableCargoWeight);
      }
      fillCargo(0, 1, remainingWeight);
    },
    [maxCargo, cargoMap, ...cargoDesired, paxBagWeight],
  );

  const processZfw = useCallback(
    (newZfw) => {
      let paxCargoWeight = newZfw - emptyWeight;

      // Load pax first
      const pWeight = paxWeight + paxBagWeight;
      const newPax = Math.max(Math.min(Math.round(paxCargoWeight / pWeight), maxPax), 0);

      paxCargoWeight -= newPax * pWeight;
      const newCargo = Math.max(Math.min(paxCargoWeight, maxCargo), 0);

      setTargetPax(newPax);
      setTargetCargo(newPax, newCargo);
    },
    [emptyWeight, paxWeight, paxBagWeight, maxPax, maxCargo],
  );

  const processGw = useCallback(
    (newGw) => {
      let paxCargoWeight = newGw - emptyWeight - (gw - zfw); // new gw - empty - total fuel

      // Load pax first
      const pWeight = paxWeight + paxBagWeight;
      const newPax = Math.max(Math.min(Math.round(paxCargoWeight / pWeight), maxPax), 0);

      paxCargoWeight -= newPax * pWeight;
      const newCargo = Math.max(Math.min(paxCargoWeight, maxCargo), 0);

      setTargetPax(newPax);
      setTargetCargo(newPax, newCargo);
    },
    [emptyWeight, paxWeight, paxBagWeight, maxPax, maxCargo, gw, zfw],
  );

  const onClickCargo = useCallback(
    (cargoStation, e) => {
      if (gsxInProgress() || boardingStarted) {
        return;
      }
      const cargoPercent = Math.min(Math.max(0, e.nativeEvent.offsetX / cargoMap[cargoStation].progressBarWidth), 1);
      setCargoDesired[cargoStation](Math.round(cargoMap[cargoStation].weight * cargoPercent));
    },
    [cargoMap, boardingStarted, gsxBoardingState, gsxDeBoardingState, gsxPayloadSyncEnabled],
  );

  const onClickSeat = useCallback(
    (stationIndex: number, seatId: number) => {
      if (gsxInProgress() || boardingStarted) {
        return;
      }

      // TODO FIXME: This calculation does not work correctly if user clicks on many seats in rapid succession
      const oldPaxBag = totalPaxDesired * paxBagWeight;
      const freight = Math.max(totalCargoDesired - oldPaxBag, 0);
      const seatFlags: SeatFlags = desiredFlags[stationIndex];
      seatFlags.toggleSeatId(seatId);
      setDesiredFlags[stationIndex](seatFlags);

      let newPaxDesired = 0;
      desiredFlags.forEach((flag) => {
        newPaxDesired += flag.getTotalFilledSeats();
      });

      setTargetCargo(newPaxDesired, freight);
    },
    [
      paxBagWeight,
      totalCargoDesired,
      ...cargoDesired,
      ...desiredFlags,
      totalPaxDesired,
      boardingStarted,
      gsxBoardingState,
      gsxDeBoardingState,
      gsxPayloadSyncEnabled,
    ],
  );

  const handleDeboarding = useCallback(() => {
    if (!boardingStarted) {
      showModal(
        <PromptModal
          title={`${t('Ground.Payload.DeboardConfirmationTitle')}`}
          bodyText={`${t('Ground.Payload.DeboardConfirmationBody')}`}
          confirmText={`${t('Ground.Payload.DeboardConfirmationConfirm')}`}
          cancelText={`${t('Ground.Payload.DeboardConfirmationCancel')}`}
          onConfirm={() => {
            setTargetPax(0);
            setTargetCargo(0, 0);
            setTimeout(() => {
              setBoardingStarted(true);
            }, 500);
          }}
        />,
      );
      return;
    }
    setBoardingStarted(false);
  }, [totalPaxDesired, totalPax, totalCargo, boardingStarted, totalCargoDesired]);

  // Note: will need to be looked into when doors can be opened on this page.
  const [main1LeftOpen] = useState(SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:0', 'Percent over 100'));
  const [main2LeftOpen] = useState(SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:2', 'Percent over 100'));
  const [upper1LeftOpen] = useState(SimVar.GetSimVarValue('A:INTERACTIVE POINT OPEN:10', 'Percent over 100'));

  const calculateBoardingTime = useMemo(() => {
    // factors taken from payload.rs TODO: Simvar
    let boardingRateMultiplier = 0;
    if (boardingRate === 'REAL') {
      boardingRateMultiplier = 5;
    } else if (boardingRate === 'FAST') {
      boardingRateMultiplier = 1;
    }

    let boardingDoorsOpen = 0;
    if (main1LeftOpen) {
      boardingDoorsOpen++;
    }
    if (main2LeftOpen) {
      boardingDoorsOpen++;
    }
    if (upper1LeftOpen) {
      boardingDoorsOpen++;
    }
    boardingDoorsOpen = Math.max(boardingDoorsOpen, 1);
    boardingRateMultiplier /= boardingDoorsOpen;

    // factors taken from payload.rs TODO: Simvar
    const cargoWeightPerWeightStep = 60;

    const differentialPax = Math.abs(totalPaxDesired - totalPax);
    const differentialCargo = Math.abs(totalCargoDesired - totalCargo);

    const estimatedPaxBoardingSeconds = differentialPax * boardingRateMultiplier;
    const estimatedCargoLoadingSeconds = (differentialCargo / cargoWeightPerWeightStep) * boardingRateMultiplier;

    return Math.max(estimatedPaxBoardingSeconds, estimatedCargoLoadingSeconds);
  }, [
    totalPaxDesired,
    totalPax,
    totalCargoDesired,
    totalCargo,
    main1LeftOpen,
    main2LeftOpen,
    upper1LeftOpen,
    boardingRate,
  ]);

  const boardingStatusClass = useMemo(() => {
    if (!boardingStarted) {
      return 'text-theme-highlight';
    }
    return totalPaxDesired * paxWeight + totalCargoDesired >= totalPax * paxWeight + totalCargo
      ? 'text-green-500'
      : 'text-yellow-500';
  }, [boardingStarted, paxWeight, totalCargoDesired, totalCargo, totalPaxDesired, totalPax]);

  // Init
  useEffect(() => {
    if (paxWeight === 0) {
      setPaxWeight(Math.round(cabinInfo.defaultPaxWeight));
    }
    if (paxBagWeight === 0) {
      setPaxBagWeight(Math.round(cabinInfo.defaultBagWeight));
    }
  }, []);

  // Set Cold and Dark State
  useEffect(() => {
    if (eng1Running || eng4Running || !isOnGround) {
      setColdAndDark(false);
    } else {
      setColdAndDark(true);
    }
  }, [eng1Running, eng4Running, isOnGround]);

  useEffect(() => {
    if (boardingRate !== 'INSTANT') {
      if (!coldAndDark) {
        setBoardingRate('INSTANT');
      }
    }
  }, [coldAndDark, boardingRate]);

  useEffect(() => {
    if (gsxPayloadSyncEnabled === 1) {
      switch (gsxDeBoardingState) {
        case gsxStates.REQUESTED:
          // If Deboarding has been requested, set target pax to 0 for boarding backend
          setTargetPax(0);
          setTargetCargo(0, 0);
          break;
        case gsxStates.PERFORMING:
        case gsxStates.COMPLETED:
        default:
          break;
      }
    }
  }, [gsxDeBoardingState]);

  useEffect(() => {
    let simbriefStatus = false;
    if (simbriefUnits === 'kgs') {
      simbriefStatus =
        simbriefDataLoaded &&
        (simbriefPax !== totalPaxDesired ||
          Math.abs(simbriefFreight + simbriefBag * simbriefBagWeight - totalCargoDesired) > 3.0 ||
          Math.abs(simbriefPaxWeight - paxWeight) > 3.0 ||
          Math.abs(simbriefBagWeight - paxBagWeight) > 3.0);
    } else {
      simbriefStatus =
        simbriefDataLoaded &&
        (simbriefPax !== totalPaxDesired ||
          Math.abs(Units.poundToKilogram(simbriefFreight + simbriefBag * simbriefBagWeight) - totalCargoDesired) >
            3.0 ||
          Math.abs(Units.poundToKilogram(simbriefPaxWeight) - paxWeight) > 3.0 ||
          Math.abs(Units.poundToKilogram(simbriefBagWeight) - paxBagWeight) > 3.0);
    }

    if (gsxInProgress() || boardingStarted) {
      setShowSimbriefButton(false);
    } else {
      setShowSimbriefButton(simbriefStatus);
    }
  }, [
    simbriefUnits,
    simbriefFreight,
    simbriefBag,
    simbriefBagWeight,
    paxWeight,
    paxBagWeight,
    totalPaxDesired,
    totalCargoDesired,
    simbriefDataLoaded,
    boardingStarted,
    gsxPayloadSyncEnabled,
  ]);

  const remainingTimeString = () => {
    const minutes = Math.round(calculateBoardingTime / 60);
    const seconds = calculateBoardingTime % 60;
    const padding = seconds < 10 ? '0' : '';
    return `${minutes}:${padding}${seconds.toFixed(0)} ${t('Ground.Payload.EstimatedDurationUnit')}`;
  };

  const [theme] = usePersistentProperty('EFB_UI_THEME', 'blue');
  const getTheme = useCallback(
    (theme: string): [string, string, string] => {
      let base = '#fff';
      let primary = '#00C9E4';
      let secondary = '#84CC16';
      switch (theme) {
        case 'dark':
          base = '#fff';
          primary = '#3B82F6';
          secondary = '#84CC16';
          break;
        case 'light':
          base = '#000000';
          primary = '#3B82F6';
          secondary = '#84CC16';
          break;
        default:
          break;
      }
      return [base, primary, secondary];
    },
    [theme],
  );

  return (
    <div>
      <div className="relative h-content-section-reduced">
        <div className="mb-10">
          <div className="relative flex flex-col">
            {displayPaxMainDeck && <A380SeatOutlineBg stroke={getTheme(theme)[0]} highlight="#69BD45" />}
            {!displayPaxMainDeck && <A380SeatOutlineUpperBg stroke={getTheme(theme)[0]} highlight="#69BD45" />}
            <SeatMapWidget
              payloadSeatDisplay={flypadInfo.payload.seatDisplay}
              seatMap={seatMap}
              desiredFlags={desiredFlags}
              activeFlags={activeFlags}
              onClickSeat={onClickSeat}
              theme={getTheme(theme)}
              isMainDeck={displayPaxMainDeck}
              width={flypadInfo.payload.planeCanvas.width}
              height={flypadInfo.payload.planeCanvas.height}
              canvasX={flypadInfo.payload.planeCanvas.canvasX}
              canvasY={flypadInfo.payload.planeCanvas.canvasY}
            />
            <div className="absolute top-full flex w-full flex-row px-4">
              <div>
                <AirplaneFill size={25} className="mx-3 my-1" />
              </div>
              <SelectGroup>
                <SelectItem selected={displayPaxMainDeck} onSelect={() => dispatch(setDisplayPaxMainDeck(true))}>
                  {t('Ground.Payload.SelectItem.MainDeck')}
                </SelectItem>
                <SelectItem selected={!displayPaxMainDeck} onSelect={() => dispatch(setDisplayPaxMainDeck(false))}>
                  {t('Ground.Payload.SelectItem.UpperDeck')}
                </SelectItem>
              </SelectGroup>
            </div>
          </div>
        </div>
        <CargoWidget cargo={cargo} cargoDesired={cargoDesired} cargoMap={cargoMap} onClickCargo={onClickCargo} />

        <div className="relative right-0 mt-16 flex flex-row justify-between px-4">
          <div className="flex grow flex-col pr-24">
            <div className="flex w-full flex-row">
              <Card
                className="col-1 w-full"
                childrenContainerClassName={`w-full ${simbriefDataLoaded ? 'rounded-r-none' : ''}`}
              >
                <PayloadInputTable
                  airframeInfo={airframeInfo}
                  emptyWeight={emptyWeight}
                  massUnitForDisplay={massUnitForDisplay}
                  displayZfw={displayZfw}
                  BoardingInProgress={gsxInProgress() || boardingStarted}
                  totalPax={totalPax}
                  totalPaxDesired={totalPaxDesired}
                  maxPax={maxPax}
                  totalCargo={totalCargo}
                  totalCargoDesired={totalCargoDesired}
                  maxCargo={maxCargo}
                  zfw={zfw}
                  zfwDesired={zfwDesired}
                  zfwCgMac={zfwCgMac}
                  desiredZfwCgMac={desiredZfwCgMac}
                  gw={gw}
                  gwDesired={gwDesired}
                  gwCgMac={gwCgMac}
                  desiredGwCgMac={desiredGwCgMac}
                  setTargetPax={setTargetPax}
                  setTargetCargo={setTargetCargo}
                  processZfw={processZfw}
                  processGw={processGw}
                  setDisplayZfw={setDisplayZfw}
                />
                <hr className="mb-4 border-gray-700" />
                <div className="flex flex-row items-center justify-start">
                  <MiscParamsInput
                    disable={gsxInProgress() || boardingStarted}
                    minPaxWeight={Math.round(cabinInfo.minPaxWeight)}
                    maxPaxWeight={Math.round(cabinInfo.maxPaxWeight)}
                    defaultPaxWeight={Math.round(cabinInfo.defaultPaxWeight)}
                    minBagWeight={Math.round(cabinInfo.minBagWeight)}
                    maxBagWeight={Math.round(cabinInfo.maxBagWeight)}
                    defaultBagWeight={Math.round(cabinInfo.defaultBagWeight)}
                    paxWeight={paxWeight}
                    bagWeight={paxBagWeight}
                    massUnitForDisplay={massUnitForDisplay}
                    setPaxWeight={setPaxWeight}
                    setBagWeight={setPaxBagWeight}
                  />
                  {gsxPayloadSyncEnabled !== 1 && (
                    <BoardingInput
                      boardingStatusClass={boardingStatusClass}
                      boardingStarted={boardingStarted}
                      totalPax={totalPax}
                      totalCargo={totalCargo}
                      setBoardingStarted={setBoardingStarted}
                      handleDeboarding={handleDeboarding}
                    />
                  )}
                </div>
              </Card>

              {showSimbriefButton && (
                <TooltipWrapper text={t('Ground.Payload.TT.FillPayloadFromSimbrief')}>
                  <div
                    className={`flex h-auto items-center justify-center rounded-md rounded-l-none
                                                       border-2 border-theme-highlight bg-theme-highlight
                                                       px-2 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight`}
                    onClick={setSimBriefValues}
                  >
                    <CloudArrowDown size={26} />
                  </div>
                </TooltipWrapper>
              )}
            </div>
            {gsxPayloadSyncEnabled !== 1 && (
              <div className="mt-4 flex flex-row">
                <Card className="h-full w-full" childrenContainerClassName="flex flex-col w-full h-full">
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex font-medium">
                      {t('Ground.Payload.BoardingTime')}
                      <span className="relative ml-2 flex flex-row items-center text-sm font-light">
                        ({remainingTimeString()})
                      </span>
                    </div>

                    <SelectGroup>
                      <SelectItem selected={boardingRate === 'INSTANT'} onSelect={() => setBoardingRate('INSTANT')}>
                        {t('Settings.Instant')}
                      </SelectItem>

                      <TooltipWrapper
                        text={`${!coldAndDark ? t('Ground.Fuel.TT.AircraftMustBeColdAndDarkToChangeRefuelTimes') : ''}`}
                      >
                        <div>
                          <SelectItem
                            className={`${!coldAndDark && 'opacity-20'}`}
                            selected={boardingRate === 'FAST'}
                            disabled={!coldAndDark}
                            onSelect={() => setBoardingRate('FAST')}
                          >
                            {t('Settings.Fast')}
                          </SelectItem>
                        </div>
                      </TooltipWrapper>

                      <div>
                        <SelectItem
                          className={`${!coldAndDark && 'opacity-20'}`}
                          selected={boardingRate === 'REAL'}
                          disabled={!coldAndDark}
                          onSelect={() => setBoardingRate('REAL')}
                        >
                          {t('Settings.Real')}
                        </SelectItem>
                      </div>
                    </SelectGroup>
                  </div>
                </Card>

                {/* <Card className="h-full w-fit" childrenContainerClassName="h-full w-fit rounded-r-none"> */}
                {/* */}
                {/* </Card> */}
              </div>
            )}
            {gsxPayloadSyncEnabled === 1 && (
              <div className="pl-2 pt-6">{t('Ground.Payload.GSXPayloadSyncEnabled')}</div>
            )}
          </div>
          <div className="col-1 border border-theme-accent">
            <ChartWidget
              width={525}
              height={511}
              envelope={airframeInfo.designLimits.performanceEnvelope}
              limits={flypadInfo.payload.chartLimits}
              cg={boardingStarted ? Math.round(gwCgMac * 100) / 100 : Math.round(desiredGwCgMac * 100) / 100}
              gw={boardingStarted ? Math.round(gw) : Math.round(gwDesired)}
              mldwCg={boardingStarted ? Math.round(gwCgMac * 100) / 100 : Math.round(desiredGwCgMac * 100) / 100}
              mldw={boardingStarted ? Math.round(gw) : Math.round(gwDesired)}
              zfwCg={boardingStarted ? Math.round(zfwCgMac * 100) / 100 : Math.round(desiredZfwCgMac * 100) / 100}
              zfw={boardingStarted ? Math.round(zfw) : Math.round(zfwDesired)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
