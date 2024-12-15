// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useSimVar, MathUtils, AirframeType } from '@flybywiresim/fbw-sdk';
import { ZoomIn, ZoomOut } from 'react-bootstrap-icons';
import { IconPlane } from '@tabler/icons';
import { Coordinates } from 'msfs-geo';
import { computeDestinationPoint, getGreatCircleBearing } from 'geolib';
import getDistance from 'geolib/es/getPreciseDistance';
import { GeolibInputCoordinates } from 'geolib/es/types';
import { AircraftContext, BingMap, t, TooltipWrapper, useAppDispatch, useAppSelector } from '@flybywiresim/flypad';
import {
  setActualMapLatLon,
  setAircraftIconPosition,
  setCenterPlaneMode,
  setMapRange,
  TScreenCoordinates,
} from '../../../Store/features/pushback';

interface TurningRadiusIndicatorProps {
  turningRadius: number;
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', radius, radius, 0, arcSweep, 0, end.x, end.y].join(' ');
};

const TurningRadiusIndicator = ({ turningRadius }: TurningRadiusIndicatorProps) => {
  // 19 seems to be an arbitrary number to make the arc look good - initial developer did not document this
  const magicNumber = 45 + 45 * (19 / turningRadius);
  return (
    <svg width={turningRadius * 2} height={turningRadius * 2} viewBox={`0 0 ${turningRadius * 2} ${turningRadius * 2}`}>
      <path
        d={describeArc(turningRadius, turningRadius, turningRadius, 0, magicNumber)}
        fill="none"
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  );
};

export const PushbackMap = () => {
  const dispatch = useAppDispatch();
  const airframeInfo = useAppSelector((state) => state.config.airframeInfo);
  const aircraftContext = useContext(AircraftContext);
  const [planeHeadingTrue] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 50);
  const [planeLatitude] = useSimVar('A:PLANE LATITUDE', 'degrees latitude', 50);
  const [planeLongitude] = useSimVar('A:PLANE LONGITUDE', 'degrees longitude', 50);

  const [tugCmdHdgFactor] = useSimVar('L:A32NX_PUSHBACK_HDG_FACTOR', 'bool', 50);
  const [tugCmdSpdFactor] = useSimVar('L:A32NX_PUSHBACK_SPD_FACTOR', 'bool', 50);

  // Tuning-factor for the turning radius indicator - as there is not relly an easy way to calculate the curvature
  // of the turning indicator, this factor is used to "tune" the indicator to match the actual turning radius
  const [turnIndicatorTuningFactor, setTurnIndicatorTuningFactor] = useSimVar(
    'L:A32NX_PUSHBACK_TURN_INDICATOR_TUNING_FACTOR',
    'number',
    250,
  );
  const turnIndicatorTuningDefault = aircraftContext.pushbackPage.turnIndicatorTuningDefault;

  // Reducer state for pushback
  const { mapRange, centerPlaneMode, actualMapLatLon, aircraftIconPosition } = useAppSelector(
    (state) => state.pushback.pushbackState,
  );

  // This constant has been determined via testing - needs more "thought"
  // It describes the ratio between the map and real distance
  const someConstant = 0.48596;

  // Aircraft wheelbase in meters
  const aircraftWheelBase = airframeInfo.dimensions.aircraftWheelBase;
  const aircraftLengthMeter = airframeInfo.dimensions.aircraftLengthMeter;

  // Map
  const [mouseDown, setMouseDown] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragStartCoords, setDragStartCoords] = useState({ x: 0, y: 0 } as TScreenCoordinates);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 } as TScreenCoordinates);

  const handleZoomIn = () => {
    handleZoomChange(-1);
  };

  const handleZoomOut = () => {
    handleZoomChange(1);
  };

  const handleZoomChange = (value: number) => {
    const newRange = (1 + Math.sign(value) * (mapRange <= 3 ? 0.1 : 0.5)) * mapRange;
    const factor = mapRange / newRange;
    dispatch(setMapRange(MathUtils.clamp(newRange, 0.1, 1000.0)));
    // place the aircraft icon according to the zoom level
    dispatch(setAircraftIconPosition({ x: aircraftIconPosition.x * factor, y: aircraftIconPosition.y * factor }));
  };

  const handleCenterPlaneModeChange = () => {
    dispatch(setCenterPlaneMode(!centerPlaneMode));
  };

  // Calculates the size in pixels based on the real A320 length and the current zoom
  const aircraftIconSize = (mapRange: number) => {
    const pixelPerMeter = someConstant * 10; // at 0.1 range
    return MathUtils.clamp(aircraftLengthMeter * pixelPerMeter * (0.1 / mapRange), 15, 1000);
  };

  // Calculates turning radius for the Turning prediction arc
  const calculateTurningRadius = (wheelBase: number, turnAngle: number) => {
    const tanDeg = Math.tan((turnAngle * Math.PI) / 180);
    return wheelBase / tanDeg;
  };
  const mapRangeCompensationScalar = mapRange / someConstant;
  const radius = calculateTurningRadius(aircraftWheelBase, Math.abs(tugCmdHdgFactor * 90));
  const turningRadius = (radius / mapRangeCompensationScalar) * turnIndicatorTuningFactor;

  // Computes the offset from geo coordinates (Lat, Lon) and a delta of screen coordinates into
  // a destination set of geo coordinates.
  const computeOffset: (latLon: Coordinates, d: TScreenCoordinates) => Coordinates = (
    latLon: Coordinates,
    d: TScreenCoordinates,
  ) => {
    const distance = Math.hypot(d.x, d.y) / (someConstant / mapRange);
    const bearing = Math.atan2(d.y, d.x) * (180 / Math.PI) - 90 + planeHeadingTrue;
    const point = computeDestinationPoint({ lat: latLon.lat, lon: latLon.long }, distance, bearing);
    return { lat: point.latitude, long: point.longitude };
  };

  // Calculate where to place the aircraft icon when not in center mode and plane is moving
  const computeAircraftIconPosition = (planePosition: Coordinates, mapPosition: Coordinates): TScreenCoordinates => {
    const geoPlanePosition: GeolibInputCoordinates = { lat: planePosition.lat, longitude: planePosition.long };
    const geoMapPosition: GeolibInputCoordinates = { lat: mapPosition.lat, longitude: mapPosition.long };
    const distance = getDistance(geoPlanePosition, geoMapPosition, 0.00001);
    const distancePx = distance * (someConstant / mapRange);
    const bearing = getGreatCircleBearing(geoPlanePosition, geoMapPosition);
    const angle = MathUtils.angleAdd(MathUtils.angleAdd(bearing, -180), -planeHeadingTrue);
    const angleRad = Math.abs(angle) * (Math.PI / 180);
    const dX = Math.sign(angle) * Math.sin(angleRad) * distancePx;
    const dY = Math.cos(angleRad) * distancePx;
    // console.log(`Distance: ${distance} Bearing: ${bearing} Plane Heading True: ${planeHeadingTrue}`);
    // console.log(`DistancePx: ${distancePx} Angle: ${angle} dX: ${dX} dY: ${dY}`);
    return { x: dX, y: dY };
  };

  // called once when loading and unloading the page
  useEffect(() => {
    // set the tuning factor to a value determined by testing
    setTurnIndicatorTuningFactor(turnIndicatorTuningDefault);

    let timeOutID: any = 0;
    if (centerPlaneMode) {
      // setTimeout required because when loading on runway it did not
      // adjust the position from before "Ready to Fly"
      timeOutID = setTimeout(() => {
        dispatch(setActualMapLatLon({ lat: planeLatitude, long: planeLongitude }));
        dispatch(setAircraftIconPosition({ x: 0, y: 0 }));
      }, 500);
    }
    return () => {
      clearTimeout(timeOutID);
    };
  }, []);

  // Update actual lat/lon when plane is moving
  useEffect(() => {
    if (centerPlaneMode) {
      dispatch(setActualMapLatLon({ lat: planeLatitude, long: planeLongitude }));
      dispatch(setAircraftIconPosition({ x: 0, y: 0 }));
      return;
    }
    dispatch(
      setAircraftIconPosition(
        computeAircraftIconPosition({ lat: planeLatitude, long: planeLongitude }, actualMapLatLon),
      ),
    );
  }, [centerPlaneMode, mapRange, planeLatitude.toFixed(6), planeLongitude.toFixed(6)]);

  // Update actual lat/lon when dragging the map
  useEffect(() => {
    if (dragging) {
      dispatch(setCenterPlaneMode(false));
      const delta = { x: mouseCoords.x - dragStartCoords.x, y: mouseCoords.y - dragStartCoords.y };
      const latLon: Coordinates = computeOffset(actualMapLatLon, delta);
      dispatch(setActualMapLatLon(latLon));
      dispatch(setAircraftIconPosition({ x: aircraftIconPosition.x + delta.x, y: aircraftIconPosition.y - delta.y }));
      setDragStartCoords(mouseCoords);
    }
  }, [dragging, mouseDown, mouseCoords]);

  const mapConfigPath = useMemo(() => {
    switch (airframeInfo.variant) {
      case AirframeType.A380_842:
        return '/Pages/VCockpit/Instruments/Airliners/FlyByWire_A380/EFB/';
      case AirframeType.A320_251N:
      default:
        return '/Pages/VCockpit/Instruments/Airliners/FlyByWire_A320_Neo/EFB/';
    }
  }, [airframeInfo]);

  return (
    <>
      {/* Map Container */}
      <div
        className="relative flex h-[430px] grow flex-col space-y-4 overflow-hidden rounded-lg border-2 border-theme-accent"
        onMouseDown={(e) => {
          setMouseDown(true);
          setDragStartCoords({ x: e.pageX, y: e.pageY });
        }}
        onMouseMove={(e) => {
          if (mouseDown) {
            setMouseCoords({ x: e.pageX, y: e.pageY });
          }
          if (
            mouseDown &&
            !dragging &&
            (Math.abs(e.pageX - dragStartCoords.x) > 3 || Math.abs(e.pageY - dragStartCoords.y) > 3)
          ) {
            setDragging(true);
          }
        }}
        onMouseUp={() => {
          setMouseDown(false);
          if (dragging) {
            setDragging(false);
          }
        }}
      >
        {/* Map */}
        {!process.env.VITE_BUILD && (
          <BingMap
            configFolder={mapConfigPath}
            centerLla={actualMapLatLon}
            mapId="PUSHBACK_MAP"
            range={mapRange}
            rotation={-planeHeadingTrue}
          />
        )}

        {/* Aircraft and Turning Radius Indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          {centerPlaneMode && !Number.isNaN(turningRadius) && Number.isFinite(turningRadius) && (
            <div
              className="absolute"
              style={{
                transform: `rotate(-90deg)
                                    scaleX(${tugCmdSpdFactor >= 0 ? 1 : -1})
                                    scaleY(${tugCmdHdgFactor >= 0 ? 1 : -1})
                                    translateY(${turningRadius}px)`,
              }}
            >
              <TurningRadiusIndicator turningRadius={turningRadius} />
            </div>
          )}
          <IconPlane
            className="text-theme-highlight"
            style={{
              transform: `rotate(-90deg) translateY(${Math.sign(aircraftIconPosition.x) * Math.min(1000, Math.abs(aircraftIconPosition.x))}px) translateX(${Math.sign(aircraftIconPosition.y) * Math.min(1000, Math.abs(aircraftIconPosition.y))}px)`,
            }}
            size={aircraftIconSize(mapRange)}
            strokeLinejoin="miter"
            stroke={1}
          />
        </div>

        {/* Map Controls */}
        <div className="absolute bottom-6 right-6 z-30 flex cursor-pointer flex-col overflow-hidden rounded-md">
          <TooltipWrapper text={t('Pushback.TT.CenterPlaneMode')}>
            <button
              type="button"
              onClick={() => handleCenterPlaneModeChange()}
              className="cursor-pointer bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
            >
              <IconPlane
                className={`-rotate-90 text-white${centerPlaneMode && 'fill-current'}`}
                size={40}
                strokeLinejoin="round"
              />
            </button>
          </TooltipWrapper>
          <TooltipWrapper text={t('Pushback.TT.ZoomIn')}>
            <button
              type="button"
              onClick={() => handleZoomIn()}
              className="cursor-pointer bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
            >
              <ZoomIn size={40} />
            </button>
          </TooltipWrapper>
          <TooltipWrapper text={t('Pushback.TT.ZoomOut')}>
            <button
              type="button"
              onClick={() => handleZoomOut()}
              className="cursor-pointer bg-theme-secondary p-2 transition duration-100 hover:bg-theme-highlight hover:text-theme-body"
            >
              <ZoomOut size={40} />
            </button>
          </TooltipWrapper>
        </div>
      </div>
    </>
  );
};
