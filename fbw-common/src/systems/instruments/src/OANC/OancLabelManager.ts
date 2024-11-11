// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { clampAngle } from 'msfs-geo';
import { Feature, LineString } from '@turf/turf';
import { ArraySubject } from '@microsoft/msfs-sdk';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { FmsDataStore } from './';
import { filterLabel, labelStyle, OancLabelFilter } from './OancLabelFilter';
import { Label, LabelStyle, LABEL_VISIBILITY_RULES, Oanc, OANC_RENDER_HEIGHT, OANC_RENDER_WIDTH } from './Oanc';
import { intersectLineWithRectangle, isPointInRectangle, midPoint, pointAngle } from './OancMapUtils';

export class OancLabelManager<T extends number> {
  constructor(public oanc: Oanc<T>) {}

  public showLabels = false;

  public currentFilter: OancLabelFilter = { type: 'null' };

  public labels: Label[] = [];

  public visibleLabels = ArraySubject.create<Label>([]);

  public visibleLabelElements = new Map<Label, HTMLDivElement>();

  public reflowLabels(
    fmsDepRunway?: string,
    fmsLdgRunway?: string,
    btvSelectedRunway?: string,
    btvSelectedExit?: string,
  ) {
    // eslint-disable-next-line prefer-const
    let [offsetX, offsetY] = this.oanc.arpReferencedMapParams.coordinatesToXYy(this.oanc.referencePos);

    // TODO figure out how to not need this
    offsetY *= -1;

    const mapCurrentHeading = this.oanc.interpolatedMapHeading.get();

    const rotate = -mapCurrentHeading;

    if (this.oanc.doneDrawing && this.showLabels && LABEL_VISIBILITY_RULES[this.oanc.zoomLevelIndex.get()]) {
      this.oanc.labelContainerRef.instance.style.visibility = 'inherit';

      for (const label of this.visibleLabels.getArray()) {
        const element = this.visibleLabelElements.get(label);

        if (!element) {
          continue;
        }

        const labelVisible = filterLabel(
          label,
          this.currentFilter,
          fmsDepRunway,
          fmsLdgRunway,
          btvSelectedRunway,
          btvSelectedExit,
        );
        if (label.style === LabelStyle.RunwayEnd && btvSelectedRunway) {
          // console.log(label, this.currentFilter, fmsDepRunway, fmsLdgRunway, btvSelectedRunway, btvSelectedExit);
        }

        if (!labelVisible) {
          element.style.visibility = 'hidden';
          continue;
        } else if ([LabelStyle.BtvSelectedRunwayArrow, LabelStyle.FmsSelectedRunwayEnd].includes(label.style)) {
          element.style.visibility = 'inherit';
        }

        const [labelX, labelY] = label.position;

        const hypotenuse = Math.sqrt(labelX ** 2 + labelY ** 2) * this.oanc.getZoomLevelInverseScale();
        const angle = clampAngle(Math.atan2(labelY, labelX) * MathUtils.RADIANS_TO_DEGREES);

        const rotationAdjustX = hypotenuse * Math.cos((angle - rotate) * MathUtils.DEGREES_TO_RADIANS);
        const rotationAdjustY = hypotenuse * Math.sin((angle - rotate) * MathUtils.DEGREES_TO_RADIANS);

        const scaledOffsetX = offsetX * this.oanc.getZoomLevelInverseScale();
        const scaledOffsetY = offsetY * this.oanc.getZoomLevelInverseScale();

        if (label.style !== LabelStyle.RunwayAxis && label.style !== LabelStyle.FmsSelectedRunwayAxis) {
          let labelScreenX = OANC_RENDER_WIDTH / 2 + rotationAdjustX + -scaledOffsetX + this.oanc.panOffsetX.get();
          let labelScreenY = OANC_RENDER_HEIGHT / 2 + -rotationAdjustY + scaledOffsetY + this.oanc.panOffsetY.get();

          labelScreenX += this.oanc.modeAnimationOffsetX.get();
          labelScreenY += this.oanc.modeAnimationOffsetY.get();

          if (
            labelScreenX < 0 ||
            labelScreenX > OANC_RENDER_WIDTH ||
            labelScreenY < 0 ||
            labelScreenY > OANC_RENDER_HEIGHT
          ) {
            element.style.visibility = 'hidden';
            continue;
          } else {
            element.style.visibility = 'inherit';
          }

          element.style.left = `${labelScreenX}px`;
          element.style.top = `${labelScreenY}px`;

          if (label.style === LabelStyle.RunwayEnd || label.style === LabelStyle.BtvSelectedRunwayEnd) {
            element.style.transform = `translate(-50%, -50%) rotate(${label.rotation - mapCurrentHeading}deg) translate(0px, 50px)`;
          } else if (label.style === LabelStyle.BtvSelectedRunwayArrow) {
            element.style.transform = `translate(-50%, -50%) rotate(${label.rotation - mapCurrentHeading}deg) translate(0px, -100px) rotate(-180deg)`;
          } else if (label.style === LabelStyle.FmsSelectedRunwayEnd) {
            element.style.transform = `translate(-50%, -50%) rotate(${label.rotation - mapCurrentHeading}deg) translate(0px, 82.5px)`;
          } else {
            element.style.transform = 'translate(-50%, -50%)';
          }
        } else {
          const runway = label.associatedFeature as Feature<LineString>;

          // Get the screen coordinates of each runway end
          const [sx1, sy1] = this.oanc.projectPoint(runway.geometry.coordinates[0]);
          const [sx2, sy2] = this.oanc.projectPoint(
            runway.geometry.coordinates[runway.geometry.coordinates.length - 1],
          );

          const [lcx, lcy] = midPoint(sx1, sy1, sx2, sy2);

          const rx = 0;
          const ry = 0;
          const rw = OANC_RENDER_WIDTH;
          const rh = OANC_RENDER_HEIGHT;

          const rwyAngle = clampAngle(pointAngle(sx1, sy1, sx2, sy2) - 90);

          // Find intersections of the runway with the screen
          const intersections = intersectLineWithRectangle(sx1, sy1, sx2, sy2, rx, ry, rw, rh);

          let x: number;
          let y: number;
          if (intersections.length > 1) {
            // const s1dlc = pointDistance(intersections[0][0], intersections[0][1], lcx, lcy);
            // const s2dlc = pointDistance(intersections[1][0], intersections[1][1], lcx, lcy);

            // const offset = s2dlc - s1dlc;

            // Line screen center

            const lscx = intersections[0][0] + (intersections[1][0] - intersections[0][0]) / 2;
            const lscy = intersections[0][1] + (intersections[1][1] - intersections[0][1]) / 2;

            // const lscd = pointDistance(lscx, lscy, lcx, lcy);

            const lsci = intersectLineWithRectangle(lscx, lscy, lcx, lcy, rx, ry, rw, rh);

            if (lsci.length > 0) {
              x = intersections[0][0];
              y = intersections[0][1];
            } else {
              x = lcx;
              y = lcy;
            }

            // console.log(`${label.text}: ${lscd.toFixed(1)}, ${lsci.map((it) => it.join(', ')).join('; ')}`);

            // const ox = s1dlc * Math.cos(screenAngle * MathUtils.DEGREES_TO_RADIANS);
            // const oy = s1dlc * Math.sin(screenAngle * MathUtils.DEGREES_TO_RADIANS);

            // x = (intersections[0][0]) - ox;
            // y = (intersections[0][1]) - oy;
          } else if (intersections.length > 0) {
            const [px, py] = isPointInRectangle(sx1, sy1, rx, ry, rw, rh) ? [sx1, sy1] : [sx2, sy2];

            const xLength = intersections[0][0] - px;
            const yLength = intersections[0][1] - py;

            const hypotenuse = Math.sqrt(xLength ** 2 + yLength ** 2);
            const newHypotenuse = hypotenuse - 50;
            const angle = Math.atan2(yLength, xLength);

            x = px + Math.cos(angle) * newHypotenuse;
            y = py + Math.sin(angle) * newHypotenuse;

            // x = intersections[0][0];
            // y = intersections[0][1];
          } else {
            x = -1000;
            y = -1000;
          }

          x += this.oanc.modeAnimationOffsetX.get();
          y += this.oanc.modeAnimationOffsetY.get();

          element.style.left = `${x}px`;
          element.style.top = `${y}px`;

          // console.log('runway line heading: ', label.text, label.rotation);

          element.style.transform = `translate(-50%, -50%) rotate(${rwyAngle + (rwyAngle > 180 ? 90 : -90)}deg)`;

          // console.log(`Runway intersections (${label.text}):`, intersections);
        }
      }
    } else {
      this.oanc.labelContainerRef.instance.style.visibility = 'hidden';
    }
  }

  public updateLabelClasses(
    fmsDataStore: FmsDataStore,
    isFmsOrigin: boolean,
    isFmsDestination: boolean,
    btvSelectedRunway: string,
    btvSelectedExit: string,
  ) {
    this.visibleLabelElements.forEach((val, key) => {
      const newLabelStyle = labelStyle(
        key,
        fmsDataStore,
        isFmsOrigin,
        isFmsDestination,
        btvSelectedRunway,
        btvSelectedExit,
      );
      val.classList.remove(`oanc-label-style-${key.style}`);
      val.classList.add(`oanc-label-style-${newLabelStyle}`);
      key.style = newLabelStyle;
    });
  }

  public clearLabels() {
    this.labels.length = 0;
    this.visibleLabels.clear();

    for (const label of this.visibleLabelElements.values()) {
      label.remove();
    }

    this.visibleLabelElements.clear();
  }
}
