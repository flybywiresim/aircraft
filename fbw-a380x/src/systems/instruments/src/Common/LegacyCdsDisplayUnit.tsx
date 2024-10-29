import React, { forwardRef, PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { DcElectricalBus } from '@shared/electrical';
import { useSimVar } from './simVars';
import { useUpdate } from './hooks';

import './common.scss';
import './pixels.scss';

import './CdsDisplayUnit.scss';

export enum DisplayUnitID {
  CaptPfd,
  CaptNd,
  CaptMfd,
  FoPfd,
  FoNd,
  FoMfd,
  Ewd,
  Sd,
}

const DisplayUnitToDCBus: { [k in DisplayUnitID]: DcElectricalBus[] } = {
  [DisplayUnitID.CaptPfd]: [DcElectricalBus.DcEss],
  [DisplayUnitID.CaptNd]: [DcElectricalBus.DcEss, DcElectricalBus.Dc1],
  [DisplayUnitID.CaptMfd]: [DcElectricalBus.DcEss, DcElectricalBus.Dc1],
  [DisplayUnitID.FoPfd]: [DcElectricalBus.Dc2],
  [DisplayUnitID.FoNd]: [DcElectricalBus.Dc1, DcElectricalBus.Dc2],
  [DisplayUnitID.FoMfd]: [DcElectricalBus.Dc1, DcElectricalBus.Dc2],
  [DisplayUnitID.Ewd]: [DcElectricalBus.DcEss],
  [DisplayUnitID.Sd]: [DcElectricalBus.Dc2],
};

const DisplayUnitToPotentiometer: { [k in DisplayUnitID]: number } = {
  [DisplayUnitID.CaptPfd]: 88,
  [DisplayUnitID.CaptNd]: 89,
  [DisplayUnitID.CaptMfd]: 98,
  [DisplayUnitID.FoPfd]: 90,
  [DisplayUnitID.FoNd]: 91,
  [DisplayUnitID.FoMfd]: 99,
  [DisplayUnitID.Ewd]: 92,
  [DisplayUnitID.Sd]: 93,
};

interface DisplayUnitProps {
  displayUnitId: DisplayUnitID;
  failed?: boolean;
}

enum DisplayUnitState {
  On,
  Off,
  ThalesBootup,
  Selftest,
  Standby,
}

function BacklightBleed(props) {
  if (props.homeCockpit) {
    return null;
  }
  return <div className="BacklightBleed" />;
}

export const LegacyCdsDisplayUnit = forwardRef<SVGSVGElement, PropsWithChildren<DisplayUnitProps>>(
  ({ displayUnitId, failed, children }, ref) => {
    const [coldDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN' /* TODO 380 simvar */, 'Bool', 200);
    const [state, setState] = useState(coldDark ? DisplayUnitState.Off : DisplayUnitState.Standby);
    const [timer, setTimer] = useState<number | null>(null);
    const thalesBootupEndTime = useRef<number | null>(null);

    const [potentiometer] = useSimVar(
      `LIGHT POTENTIOMETER:${DisplayUnitToPotentiometer[displayUnitId]}`,
      'percent over 100',
      200,
    );
    const [electricityState0] = useSimVar(
      `L:A32NX_ELEC_${DisplayUnitToDCBus[displayUnitId][0]}_BUS_IS_POWERED` /* TODO 380 simvar */,
      'bool',
      200,
    );
    const [electricityState1] = useSimVar(
      `L:A32NX_ELEC_${DisplayUnitToDCBus[displayUnitId][1]}_BUS_IS_POWERED` /* TODO 380 simvar */,
      'bool',
      200,
    );
    const [homeCockpit] = useSimVar('L:A32NX_HOME_COCKPIT_ENABLED', 'bool', 200);

    useUpdate(
      useCallback(
        (deltaTime) => {
          if (timer !== null && thalesBootupEndTime.current !== null) {
            if (state === DisplayUnitState.ThalesBootup || DisplayUnitState.Selftest) {
              setTimer((current) => {
                if (current !== null) {
                  return Math.max(0, current - deltaTime / 1000);
                }

                return current;
              });
            }

            if (timer > 0 && timer < thalesBootupEndTime.current) {
              setState(DisplayUnitState.Selftest);
            } else if (timer <= 0) {
              setState(DisplayUnitState.On);
            } else if (state === DisplayUnitState.Standby) {
              setState(DisplayUnitState.Off);
              setTimer(null);
            } else if (state === DisplayUnitState.Selftest) {
              setState(DisplayUnitState.On);
              setTimer(null);
            }
          }

          // override MSFS menu animations setting for this instrument
          if (!document.documentElement.classList.contains('animationsEnabled')) {
            document.documentElement.classList.add('animationsEnabled');
          }
        },
        [timer, state],
      ),
    );

    useEffect(() => {
      if (state !== DisplayUnitState.Off && failed) {
        setState(DisplayUnitState.Off);
      } else if (
        state === DisplayUnitState.On &&
        (potentiometer === 0 || (electricityState0 === 0 && electricityState1 === 0))
      ) {
        setState(DisplayUnitState.Standby);
        setTimer(10);
      } else if (
        state === DisplayUnitState.Standby &&
        potentiometer !== 0 &&
        (electricityState0 !== 0 || electricityState1 !== 0)
      ) {
        setState(DisplayUnitState.On);
        setTimer(null);
      } else if (
        state === DisplayUnitState.Off &&
        potentiometer !== 0 &&
        (electricityState0 !== 0 || electricityState1 !== 0) &&
        !failed
      ) {
        setState(DisplayUnitState.ThalesBootup);
        const delay = parseInt(NXDataStore.get('CONFIG_SELF_TEST_TIME', '15')) - 0.5 + Math.random();
        setTimer(delay);
        thalesBootupEndTime.current = delay - (0.25 + Math.random() * 0.2);
      } else if (
        (state === DisplayUnitState.Selftest || state === DisplayUnitState.ThalesBootup) &&
        (potentiometer === 0 || (electricityState0 === 0 && electricityState1 === 0))
      ) {
        setState(DisplayUnitState.Off);
        setTimer(null);
      }
    }, [timer, state, potentiometer, electricityState0, electricityState1]);

    if (window.ACE_ENGINE_HANDLE) {
      return (
        <>
          <svg ref={ref} viewBox="0 0 768 1024">
            {children}
          </svg>
        </>
      );
    }

    if (state === DisplayUnitState.ThalesBootup) {
      return (
        <>
          <BacklightBleed homeCockpit={homeCockpit} />
          <svg className="SelfTest" viewBox="0 0 768 1024">
            <rect className="SelfTestBackground" x="0" y="0" width="100%" height="100%" />

            <rect x={84} y={880} width={600} height={70} fill="#ffffff" />
            <rect x={89} y={885} width={35} height={60} fill="#4d4dff" />
          </svg>
        </>
      );
    }

    if (state === DisplayUnitState.Selftest) {
      return (
        <>
          <BacklightBleed homeCockpit={homeCockpit} />
          <svg className="SelfTest" viewBox="0 0 768 1024">
            <rect className="SelfTestBackground" x="0" y="0" width="100%" height="100%" />

            <text className="SelfTestText" x="50%" y="50%">
              SAFETY TEST IN PROGRESS
            </text>
            <text className="SelfTestText" x="50%" y="54%">
              (MAX 30 SECONDS)
            </text>
          </svg>
        </>
      );
    }

    if (state === DisplayUnitState.Off) {
      return <></>;
    }

    return (
      <>
        <BacklightBleed homeCockpit={homeCockpit} />
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          ref={ref}
          viewBox="0 0 768 1024"
          style={{ visibility: state === DisplayUnitState.On ? 'visible' : 'hidden' }}
        >
          {children}
        </svg>
      </>
    );
  },
);
