// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import * as React from 'react';
// viewBox="0 0 777 814"
export const GroundServiceOutline = ({
  className,
  cabinLeftStatus,
  cabinRightStatus,
  aftLeftStatus,
  aftRightStatus,
}: {
  className: string;
  cabinLeftStatus: boolean;
  cabinRightStatus: boolean;
  aftLeftStatus: boolean;
  aftRightStatus: boolean;
}) => (
  <svg id="SVG" className={className} xmlns="http://www.w3.org/2000/svg" width="777" height="814" viewBox="0 0 777 814">
    <defs>
      <style>
        {
          '.cls-1,.cls-2,.cls-4,.cls-5,.cls-7{fill:none;stroke-miterlimit:10}.cls-1,.cls-4{stroke:currentColor}.cls-2,.cls-4{stroke-width:2px}.cls-2{stroke:currentColor}.cls-5,.cls-7{stroke:currentColor;stroke-width:.5px}.cls-7{stroke:currentColor}'
        }
      </style>
    </defs>
    <g id="SVG_Detail_Lines">
      <g id="Engines">
        <g id="ENG_1">
          <g id="Strakes">
            <path
              id="Outer_Strake"
              className="cls-5"
              d="m245.67 265.78 1.36 21.31-6.67.39c.61-8.46 2.21-16.4 5.3-21.71Z"
            />
            <path
              id="Inner_Strake"
              className="cls-5"
              d="m276.83 265.78-1.36 21.31 6.67.39c-.61-8.46-2.21-16.4-5.3-21.71Z"
            />
          </g>
          <g id="Reverser_Door">
            <path id="Outer_Side" className="cls-5" d="M256.92 295.91c-7.92 0-14.42-.09-19.83-.7" />
            <path id="Inner_Side" className="cls-5" d="M265.58 295.91c7.92 0 14.42-.09 19.83-.7" />
          </g>
          <g id="Engine_Mount">
            <g id="Connections">
              <path
                id="Fan_Connection"
                className="cls-7"
                d="m238.37 261.87.37-2.34c14.97-1.51 30.05-1.51 45.02 0l.37 2.34"
              />
              <path id="Middle_Connection" className="cls-7" d="M261.25 252.6v5.8" />
            </g>
            <g id="Mounts">
              <path id="Left_Mount" className="cls-5" d="M255.06 295.9v-37.5" />
              <path id="Right_Mount" className="cls-5" d="M267.39 295.9v-37.42" />
              <path id="Front_Mount" className="cls-5" d="M255.06 260.72h12.33" />
            </g>
          </g>
          <path id="Wing_Mount" className="cls-5" d="m272.64 321.82-7.6 3.97-9.98 9.57" />
        </g>
        <g id="ENG_2">
          <g id="Strakes-2">
            <path
              id="Outer_Strake-2"
              className="cls-5"
              d="m530.97 265.78-1.36 21.31 6.67.39c-.61-8.46-2.21-16.4-5.3-21.71Z"
            />
            <path
              id="Inner_Strake-2"
              className="cls-5"
              d="m499.81 265.78 1.36 21.31-6.67.39c.61-8.46 2.21-16.4 5.3-21.71Z"
            />
          </g>
          <g id="Reverser_Door-2">
            <path id="Outer_Side-2" className="cls-5" d="M519.72 295.91c7.92 0 14.42-.09 19.83-.7" />
            <path id="Inner_Side-2" className="cls-5" d="M511.05 295.91c-7.92 0-14.42-.09-19.83-.7" />
          </g>
          <g id="Engine_Mount-2">
            <g id="Connections-2">
              <path
                id="Fan_Connection-2"
                className="cls-7"
                d="m538.27 261.87-.37-2.34a224.275 224.275 0 0 0-45.02 0l-.37 2.34"
              />
              <path id="Middle_Connection-2" className="cls-7" d="M515.39 252.6v5.8" />
            </g>
            <g id="Mounts-2">
              <path id="Right_Mount-2" className="cls-5" d="M521.58 295.9v-37.5" />
              <path id="Left_Mount-2" className="cls-5" d="M509.25 295.9v-37.42" />
              <path id="Front_Mount-2" className="cls-5" d="M521.58 260.72h-12.33" />
            </g>
          </g>
          <path id="Wing_Mount-2" className="cls-5" d="m503.99 321.82 7.61 3.97 9.15 8.61" />
        </g>
      </g>
      <g id="Emergency_Lines">
        <path id="Left_Emergency_Marks" className="cls-5" d="M346.2 307h-20.55a6.31 6.31 0 0 0-6.31 6.31v84.6" />
        <path id="Right_Emergency_Marks" className="cls-5" d="M430.18 307h20.55a6.31 6.31 0 0 1 6.31 6.31v84.6" />
      </g>
      <g id="Wing_Layers">
        <path id="Left_Wing_Markings" className="cls-5" d="M346.2 292.33 35.36 449.78v11.89l219.86-87.34 64.11-12.21" />
        <path
          id="Right_Wing_Markings"
          className="cls-5"
          d="m430.19 292.71 312.1 158.12v11.34l-221.12-87.84-64.09-12.21"
        />
      </g>
      <g id="Doors">
        <g id="Rear_Doors">
          <path
            id="AFT_Left_PS_PSS"
            className="cls-2"
            d="M352.06 650.21h5.13c1.55 0 2.74-1.36 2.54-2.9l-1.55-11.75a2.558 2.558 0 0 0-2.54-2.23h-6.16"
            style={{
              stroke: '#6bbe45',
              strokeWidth: 2,
              fill: aftLeftStatus ? '#6bbe45' : 'none',
              strokeMiterlimit: 10,
            }}
          />
          <path
            id="AFT_Right_CAT"
            className="cls-2"
            d="M424.48 650.21h-5.13c-1.55 0-2.74-1.36-2.54-2.9l1.55-11.75a2.558 2.558 0 0 1 2.54-2.23h6.16"
            style={{
              stroke: '#6bbe45',
              strokeWidth: 2,
              fill: aftRightStatus ? '#6bbe45' : 'none',
              strokeMiterlimit: 10,
            }}
          />
        </g>
        <g id="Emergency_Doors">
          <path
            id="AFT_Left_EMG"
            className="cls-2"
            d="M346.2 337.61h3.14c.95 0 1.72-.77 1.72-1.72v-7.61c0-.95-.77-1.72-1.72-1.72h-3.14"
            style={{
              stroke: '#6bbe45',
              strokeWidth: 2,
              fill: 'none',
              strokeMiterlimit: 10,
            }}
          />
          <path
            id="FWD_Left_EMG"
            className="cls-2"
            d="M346.2 319.32h3.14c.95 0 1.72-.77 1.72-1.72v-7.61c0-.95-.77-1.72-1.72-1.72h-3.14"
            style={{
              stroke: '#6bbe45',
              strokeWidth: 2,
              fill: 'none',
              strokeMiterlimit: 10,
            }}
          />
          <path
            id="AFT_Right_EMG"
            className="cls-2"
            d="M430.28 337.61h-3.14c-.95 0-1.72-.77-1.72-1.72v-7.61c0-.95.77-1.72 1.72-1.72h3.14"
            style={{
              stroke: '#6bbe45',
              strokeWidth: 2,
              fill: 'none',
              strokeMiterlimit: 10,
            }}
          />
          <path
            id="FWD_Right_EMG"
            className="cls-2"
            d="M430.28 319.32h-3.14c-.95 0-1.72-.77-1.72-1.72v-7.61c0-.95.77-1.72 1.72-1.72h3.14"
            style={{
              stroke: '#6bbe45',
              strokeWidth: 2,
              fill: 'none',
              strokeMiterlimit: 10,
            }}
          />
        </g>
        <g id="Front_Doors">
          <path
            id="FWD_Right_CAT"
            className="cls-2"
            d="M430.28 118.06h-9.08a2.67 2.67 0 0 1-2.67-2.67v-11.72a2.67 2.67 0 0 1 2.67-2.67h8.38"
            style={{
              stroke: '#6bbe45',
              strokeWidth: 2,
              fill: cabinRightStatus ? '#6bbe45' : 'none',
              strokeMiterlimit: 10,
            }}
          />
          <path
            id="FWD_Left_PS_PSS"
            className="cls-2"
            d="M346.2 118.06h9.08a2.67 2.67 0 0 0 2.67-2.67v-11.72a2.67 2.67 0 0 0-2.67-2.67h-8.38"
            style={{
              stroke: '#6bbe45',
              strokeWidth: 2,
              fill: cabinLeftStatus ? '#6bbe45' : 'none',
              strokeMiterlimit: 10,
            }}
          />
        </g>
        <g id="Cargo_Doors">
          <g id="BLK_Cargo">
            <path className="cls-2" d="M430.19 553.33h-2" />
            <path
              d="M423.87 553.33h-7.83c-1.4 0-2.54 1.14-2.54 2.54v15.25c0 1.4 1.14 2.54 2.54 2.54h9.99"
              style={{
                strokeDasharray: '0 0 4.32 4.32',
                stroke: '#6bbe45',
                strokeWidth: 2,
                fill: 'none',
                strokeMiterlimit: 10,
              }}
            />
            <path className="cls-2" d="M428.19 573.67h2" />
          </g>
          <g id="AFT_Cargo">
            <path className="cls-2" d="M430.18 503h-2" />
            <path
              d="M424.16 503h-14.91c-1.98 0-3.58-1.6-3.58-3.58v-27.33c0-1.98 1.6-3.58 3.58-3.58h17.02"
              style={{
                strokeDasharray: '0 0 4.03 4.03',
                stroke: '#6bbe45',
                strokeWidth: 2,
                fill: 'none',
                strokeMiterlimit: 10,
              }}
            />
            <path className="cls-2" d="M428.28 468.5h2" />
          </g>
          <g id="FWD_Cargo">
            <path className="cls-2" d="M430.28 154.67h-2" />
            <path
              d="M424.2 154.67h-15.17c-2.13 0-3.86 1.73-3.86 3.86v26.94c0 2.13 1.73 3.86 3.86 3.86h17.21"
              style={{
                strokeDasharray: '0 0 4.08 4.08',
                stroke: '#6bbe45',
                strokeWidth: 2,
                fill: 'none',
                strokeMiterlimit: 10,
              }}
            />
            <path className="cls-2" d="M428.28 189.33h2" />
          </g>
        </g>
      </g>
    </g>
    <g id="SVG_Main_Lines">
      <g id="Rear_Stablizer">
        <g id="Right_Fin">
          <path id="Right_Elevator" className="cls-1" d="m409.78 769.69 3.03-21.36 109.98 38.56" />
          <path
            id="Right_Fin_Outline"
            className="cls-4"
            d="M405.01 769.34c3.31-.08 7.06.74 8.21 1.02 3.98.98 109.58 24.53 109.58 24.53v-12.35c0-6.22-1.16-14.42-6.88-17.99.08.17-86.62-55.2-86.62-55.2-5.14-3.32-10.2-6.8-12.7-16.62"
          />
        </g>
        <g id="Left_Fin">
          <path id="Left_Elevator" className="cls-1" d="m366.7 769.69-3.03-21.36-109.98 38.56" />
          <path
            id="Left_Fin_Outline"
            className="cls-4"
            d="M371.47 769.34c-3.31-.08-7.06.74-8.21 1.02-3.98.98-109.58 24.53-109.58 24.53v-12.35c0-6.22 1.16-14.42 6.88-17.99-.08.17 86.62-55.2 86.62-55.2 5.14-3.32 10.2-6.8 12.7-16.62"
          />
        </g>
        <path
          id="Rudder"
          className="cls-4"
          d="M388.5 796.17s-6-61-6-87.33 2.5-75.5 6-75.5h.07c3.5 0 5.93 49.17 5.93 75.5s-6 87.33-6 87.33"
        />
      </g>
      <g id="Wings">
        <g id="Right_Wing">
          <g id="Right_Slats">
            <path id="Inner_Slats" className="cls-1" d="M436.35 283.52v10.37L500.48 327l4.56-7.85" />
            <g id="Main_Slats">
              <path id="Outer_Divider" className="cls-1" d="m692.06 423.46 3.29-5.59" />
              <path id="Middle_Divider" className="cls-1" d="m637.09 395.69 3.77-6.09" />
              <path id="Inner_Divider" className="cls-1" d="m582.46 368.11 3.63-6.92" />
              <path id="Main_Slats_Outline" className="cls-1" d="m740.33 441.28-3.3 4.89-216.28-109.23v-9.72" />
            </g>
          </g>
          <g id="Right_Wing_Flap_Fairings">
            <path
              id="Outer"
              className="cls-1"
              d="M645.34 447.05c-.41 8.89 2.83 18.13 2.83 18.13s2.62-8.94 2.87-16.34"
            />
            <path
              id="Middle"
              className="cls-1"
              d="M565.52 422.12c-.15 6.84 3.02 17.3 3.02 17.3s3.04-10.89 3.24-15.35"
            />
            <path id="Inner" className="cls-1" d="M490.43 409.89c0 6.63 3.2 15.28 3.2 15.28s2.71-9.28 2.71-15.28" />
          </g>
          <g id="Right_Flaps">
            <path id="Flap_Divider" className="cls-1" d="M527.05 410.11v-11.35" />
            <path id="Flap_Outline" className="cls-1" d="M430.28 397.92h94.45l156.08 56.58v3.63" />
          </g>
          <g id="Right_Spoilers">
            <path id="Inner_Spoiler" className="cls-1" d="M494.37 397.92V384h30.34l.08 13.92" />
            <g id="Main_Spoilers">
              <path id="Outer_Divider-2" className="cls-1" d="m639.29 439.42 4.96-13.81" />
              <path id="Middle_Divider-2" className="cls-1" d="m606.89 427.68 5.25-13.7" />
              <path id="Inner_Divider-2" className="cls-1" d="m570.46 414.47 5.34-13.65" />
              <path id="Main_Spoiler_Outline" className="cls-1" d="m534.5 401.44 6.37-13.27 135.75 49.16-4.68 13.93" />
            </g>
          </g>
          <path id="Right_Aileron" className="cls-1" d="M742.29 476.96v-13.35l-56.26-20.22-1.39 2.78v12.73" />
          <g id="ENG_2-2">
            <path
              id="Engine_Mount-3"
              className="cls-1"
              d="M511.05 321.93V274.5c0-5.5 1.29-10.5 4.29-10.5h.05c3 0 4.33 5 4.33 10.5v51.92"
            />
            <path
              id="Engine"
              className="cls-4"
              d="M519.72 320.06h15.53c.62 0 1.15-.43 1.26-1.04.72-3.83 3.13-17.76 3.13-34.18 0-19.33-1.92-31.04-3-32.5-1.67-2.25-4.6-3.94-21.18-3.94h-.15c-16.58 0-19.5 1.69-21.17 3.94-1.08 1.46-3 13.17-3 32.5 0 11.27 1.13 21.38 2.08 27.84"
            />
            <path id="Exhaust" className="cls-1" d="M530.05 320.06s-1.97 8.42-3.34 10" />
            <path id="Engine_Inner_end" className="cls-4" d="M507.45 320.06h3.6" />
            <path id="Cowling" className="cls-1" d="M493.6 255.65c0-4.06 43.58-4.06 43.58 0" />
          </g>
          <path
            id="Right_Wing_Outliine"
            className="cls-4"
            d="M430.28 409.89h96.07l225.04 70.28s3.99 14.18 5.65 14.18-3.56-29.35-3.74-30.59c0 0-2.65-17.49-13.84-23.29S435.68 282.9 435.68 282.9c-2.57-1.57-5.39-30-5.39-30"
          />
        </g>
        <g id="Left_Wing">
          <g id="Left_Slats">
            <path id="Inner_Slats-2" className="cls-1" d="M339.62 283.52v10.37L275.5 327l-4.57-7.85" />
            <g id="Main_Slats-2">
              <path id="Outer_Divider-3" className="cls-1" d="m83.92 423.46-3.3-5.59" />
              <path id="Middle_Divider-3" className="cls-1" d="m138.89 395.69-3.78-6.09" />
              <path id="Inner_Divider-3" className="cls-1" d="m193.51 368.11-3.62-6.92" />
              <path id="Main_Slats_Outline-2" className="cls-1" d="m35.65 441.28 3.29 4.89 216.28-109.23v-9.72" />
            </g>
          </g>
          <g id="Left_Wing_Flap_Fairings">
            <path
              id="Outer-2"
              className="cls-1"
              d="M131.14 447.05c.41 8.89-2.83 18.13-2.83 18.13s-2.62-8.94-2.87-16.34"
            />
            <path
              id="Middle-2"
              className="cls-1"
              d="M210.96 422.12c.15 6.84-3.02 17.3-3.02 17.3s-3.04-10.89-3.24-15.35"
            />
            <path id="Inner-2" className="cls-1" d="M286.05 409.89c0 6.63-3.2 15.28-3.2 15.28s-2.71-9.28-2.71-15.28" />
          </g>
          <g id="Left_Flaps">
            <path id="Flap_Divider-2" className="cls-1" d="M249.43 410.11v-11.35" />
            <path id="Flap_Outline-2" className="cls-1" d="M346.2 397.92h-94.45L95.67 454.5v3.63" />
          </g>
          <g id="Left_Spoilers">
            <path id="Inner_Spoiler-2" className="cls-1" d="M282.17 397.92V384h-30.34l-.08 13.92" />
            <g id="Main_Spoilers-2">
              <path id="Outer_Divider-4" className="cls-1" d="m137.25 439.42-4.96-13.81" />
              <path id="Middle_Divider-4" className="cls-1" d="m169.65 427.68-5.25-13.7" />
              <path id="Inner_Divider-4" className="cls-1" d="m206.08 414.47-5.34-13.65" />
              <path
                id="Main_Spoilers_Outline"
                className="cls-1"
                d="m242.04 401.44-6.37-13.27-135.75 49.16 4.68 13.93"
              />
            </g>
          </g>
          <path id="Left_Aileron" className="cls-1" d="M35.36 476.96v-13.35l56.25-20.22 1.39 2.78v12.73" />
          <g id="ENG_1-2">
            <path
              id="Engine_Mount-4"
              className="cls-1"
              d="M265.58 321.93V274.5c0-5.5-1.29-10.5-4.29-10.5h-.05c-3 0-4.33 5-4.33 10.5v51.92"
            />
            <path
              id="Engine-2"
              className="cls-4"
              d="M256.92 320.06h-15.53c-.62 0-1.15-.43-1.26-1.04-.72-3.83-3.13-17.76-3.13-34.18 0-19.33 1.92-31.04 3-32.5 1.67-2.25 4.6-3.94 21.18-3.94h.15c16.58 0 19.5 1.69 21.17 3.94 1.08 1.46 3 13.17 3 32.5 0 11.27-1.13 21.38-2.08 27.84"
            />
            <path id="Exhaust-2" className="cls-1" d="M246.58 320.06s1.97 8.42 3.34 10" />
            <path id="Engine_Inner_end-2" className="cls-4" d="M269.19 320.06h-3.61" />
            <path id="Cowling-2" className="cls-1" d="M239.46 255.65c0-4.06 43.58-4.06 43.58 0" />
          </g>
          <path
            id="Left_Wing_Outline"
            className="cls-4"
            d="M346.2 409.89h-96.07L25.09 480.17s-3.99 14.18-5.65 14.18S23 465 23.18 463.76c0 0 2.65-17.49 13.84-23.29C48.21 434.67 340.8 282.9 340.8 282.9c2.57-1.57 5.39-30 5.39-30"
          />
        </g>
      </g>
      <g id="Fuselage">
        <path id="APU_Exhaust" className="cls-1" d="m384.38 809.8.59-.08c2.34-.3 4.71-.28 7.04.06h.08" />
        <g id="Cockpit_Windows">
          <g id="Cockpit_Windows_Left">
            <path
              className="cls-1"
              d="m373.46 47.17 12.18-6.93c.37-.21.6-.6.6-1.02v-7c0-.92-1.04-1.47-1.8-.95l-14.67 10c-.6.41-.75 1.24-.32 1.83l2.72 3.79a1 1 0 0 0 1.3.28ZM367.17 44.57l2.08 2.55c.21.26.33.58.33.92v2.37c0 .31-.08.61-.24.88l-3.39 5.74c-.24.4-.67.65-1.14.65h-3.74c-.63 0-1.14-.51-1.14-1.14v-.49c0-.29.07-.58.21-.84l5.53-10.49a.906.906 0 0 1 1.51-.15ZM364.33 61.34l-2.56 6.51c-.07.18-.18.34-.31.48l-3.05 3.5c-.54.62-1.32.98-2.15.98h-1.17c-.9 0-1.5-.91-1.16-1.74L358.15 61c.19-.43.61-.71 1.08-.71h4.37c.54 0 .92.55.72 1.06Z"
            />
          </g>
          <g id="Cockpit_Windows_Right">
            <path
              className="cls-1"
              d="m402.93 47.17-12.18-6.93c-.37-.21-.6-.6-.6-1.02v-7c0-.92 1.04-1.47 1.8-.95l14.67 10c.6.41.75 1.24.32 1.83l-2.72 3.79a1 1 0 0 1-1.3.28ZM409.22 44.57l-2.08 2.55c-.21.26-.33.58-.33.92v2.37c0 .31.08.61.24.88l3.39 5.74c.24.4.67.65 1.14.65h3.74c.63 0 1.14-.51 1.14-1.14v-.49c0-.29-.07-.58-.21-.84l-5.53-10.49a.906.906 0 0 0-1.51-.15ZM412.06 61.34l2.56 6.51c.07.18.18.34.31.48l3.05 3.5c.54.62 1.32.98 2.15.98h1.17c.9 0 1.5-.91 1.16-1.74L418.24 61c-.19-.43-.61-.71-1.08-.71h-4.37c-.54 0-.92.55-.72 1.06Z"
            />
          </g>
        </g>
        <path
          id="Fuselage_Outline"
          className="cls-4"
          d="M388.23 3c3.78 0 8.46 3.32 13.37 10.72 11.88 17.9 18.4 36.91 23.48 58.24 4.2 17.63 5.19 34.26 5.19 47.3v478.7c0 34.54-17.99 114-17.99 114l-3.73 19.23c-.1.51-.16 1.03-.17 1.56l-.61 16.28c-.58 9.82-2.6 20.14-6.01 32.56-3.12 11.37-5.9 24.12-11.09 30.1a.64.64 0 0 1-.46.21h-3.95c-.18 0-.35-.07-.46-.21-5.19-5.98-7.97-18.73-11.09-30.1-3.41-12.42-5.43-22.74-6.01-32.56l-.61-16.28a9.19 9.19 0 0 0-.17-1.56l-3.73-19.23s-17.99-79.46-17.99-114v-478.7c0-13.04.99-29.67 5.19-47.3 5.08-21.33 11.6-40.34 23.48-58.24C379.78 6.32 384.38 3 388.16 3h.06Z"
        />
      </g>
    </g>
  </svg>
);

export const A380GroundServiceOutline = ({
  className,
  main1LeftStatus,
  main2LeftStatus,
  main4RightStatus,
  upper1LeftStatus,
}: {
  className: string;
  main1LeftStatus: boolean;
  main2LeftStatus: boolean;
  main4RightStatus: boolean;
  upper1LeftStatus: boolean;
}) => (
  <svg
    id="BASE_SVG"
    className={className}
    data-name="BASE SVG"
    width="864"
    height="864"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 864 864"
  >
    <defs>
      <style>
        {
          '.cls-1, .cls-2, .cls-3 { fill: none; stroke: currentColor; stroke-miterlimit: 10;} .cls-2 { stroke-width: 2px;} .cls-3 { stroke-width: .5px; }'
        }
      </style>
    </defs>
    <g id="SVG_Upper_Deck">
      <path
        className="cls-1"
        d="m 408.61363,104.752 -6.4676,54.39712 0.69296,413.69532 3.92676,52.66473"
        id="Upper_Left"
      />
      <path
        className="cls-1"
        d="m 459.53078,104.64768 6.29436,53.93515 -0.69296,413.69532 -3.92676,52.66473"
        id="Upper_Right"
      />
    </g>
    <path
      id="Fuselage"
      className="cls-2"
      d="m431.03,789.53h-2.69c-3.94-12.17-9.25-29.88-11.11-41.86s-4.22-48.22-10.44-72.44c-11.33-39.33-12.89-79.56-12.89-98.67,0,0,0-401.75,0-401.78,0-8.18,2.13-45.6,8.44-76.22,6.22-30.25,21.04-53.67,31.08-53.67h.05c10.04,0,24.87,23.42,31.09,53.67,6.3,30.63,8.44,68.04,8.44,76.22,0,.03,0,401.78,0,401.78,0,19.11-1.56,59.33-12.89,98.67-6.22,24.22-8.52,60.1-10.44,72.44-1.87,11.98-7.17,29.69-11.11,41.86h-2.69"
    />
    <g id="Wide_Fuselage" data-name="Wide Fuselage">
      <path
        id="L_Wide_Fuselage"
        data-name="L Wide Fuselage"
        className="cls-1"
        d="m393.89,503.17c-.68-3.22-1.76-7.84-2.48-13.47-2.91-22.78-3.39-37.64-3.36-48.04.08-30.96.12-46.44.95-66.21.89-21.14,2.35-48.81,4.89-81.51"
      />
      <path
        id="R_Wide_Fuselage"
        data-name="R Wide Fuselage"
        className="cls-1"
        d="m473,503.17c.68-3.22,1.76-7.84,2.48-13.47,2.91-22.78,3.39-37.64,3.36-48.04-.08-30.96-.12-46.44-.95-66.21-.89-21.14-2.35-48.81-4.89-81.51"
      />
    </g>
    <path
      id="Rudder"
      className="cls-2"
      d="m433.45,615.9c2.31,0,8.55,23.33,8.55,59.77,0,18.11-8.47,151.2-8.47,151.2h-.18s-8.47-133.09-8.47-151.2c0-36.44,6.25-59.77,8.56-59.77h0Z"
    />
    <g id="Horizontal_Stablizer" data-name="Horizontal Stablizer">
      <g id="Left_Horizontal_Stablizer" data-name="Left Horizontal Stablizer">
        <polyline
          id="Left_Walk_Zone"
          data-name="Left Walk Zone"
          className="cls-3"
          points="410.5 695.5 333.33 751.17 344.17 770.67 414.83 728.5"
        />
        <g id="Left_Elevator" data-name="Left Elevator">
          <line
            id="Left_Elevator_Seperator"
            data-name="Left Elevator Seperator"
            className="cls-3"
            x1="376.58"
            y1="760.58"
            x2="376.58"
            y2="784.28"
          />
          <polyline
            id="Left_Elevator_Box"
            data-name="Left Elevator Box"
            className="cls-1"
            points="416 741.56 287.78 803.44 286.62 817.41"
          />
        </g>
        <path
          id="Left_Stablizer"
          data-name="Left Stablizer"
          className="cls-2"
          d="m421.08,767.89l-149.64,55.11,4.61-26.83c2.22-8.17,5.44-16.39,11.83-21.94l114-88.11c3-2.33,5.05-4.67,5.24-9.49"
        />
      </g>
      <g id="Right_Horizontal_Stablizer" data-name="Right Horizontal Stablizer">
        <polyline
          id="Right_Walk_Zone"
          data-name="Right Walk Zone"
          className="cls-3"
          points="456.39 695.5 533.56 751.17 522.72 770.67 452.06 728.5"
        />
        <g id="Right_Elevator" data-name="Right Elevator">
          <line
            id="Right_Elevator_Seperator"
            data-name="Right Elevator Seperator"
            className="cls-3"
            x1="490.31"
            y1="760.58"
            x2="490.31"
            y2="784.28"
          />
          <polyline
            id="Right_Elevator_Box"
            data-name="Right Elevator Box"
            className="cls-1"
            points="450.89 741.56 579.11 803.44 580.26 817.41"
          />
        </g>
        <path
          id="Right_Stablizer"
          data-name="Right Stablizer"
          className="cls-2"
          d="m445.81,767.89l149.64,55.11-4.61-26.83c-2.22-8.17-5.44-16.39-11.83-21.94l-114-88.11c-3-2.33-5.05-4.67-5.24-9.49"
        />
      </g>
    </g>
    <g id="Wings">
      <g id="Left_Wing" data-name="Left Wing">
        <g id="ENG_2" data-name="ENG 2">
          <path
            id="Exhaust_Nozzle"
            data-name="Exhaust Nozzle"
            className="cls-1"
            d="m264.02,350.22c.28,3.12.67,5.52,1.36,7.22"
          />
          <path
            id="Inlet_Leading_Edge"
            data-name="Inlet Leading Edge"
            className="cls-1"
            d="m257,293.94c0-.95,38.11-.95,38.11,0"
          />
          <g id="Cowling">
            <path
              id="Cowling_L_Rear_Edge"
              data-name="Cowling L Rear Edge"
              className="cls-3"
              d="m255.36,330.38c5.22.2,8.93.29,16.03.29"
            />
            <path
              id="Cowling_R_Rear_Edge"
              data-name="Cowling R Rear Edge"
              className="cls-3"
              d="m296.51,330.34c-5.67.22-10.86.34-17.54.33"
            />
            <path
              id="Cowling_L_Froward_Edge"
              data-name="Cowling L Froward Edge"
              className="cls-3"
              d="m255.09,307.94c5.1-.26,10.73-.42,17.15-.42"
            />
            <path
              id="Cowling_R_Foward_Edge"
              data-name="Cowling R Foward Edge"
              className="cls-3"
              d="m297.05,307.97c-5.1-.26-12.05-.45-18.48-.46"
            />
          </g>
          <path
            id="Strake"
            className="cls-3"
            d="m289.95,312.93c-.31,2.6-1.15,12.29-1.56,13.85.1.1,3.64.21,3.64.21.1-2.29-.83-12.08-2.08-14.06Z"
          />
          <g id="Pylon">
            <line
              id="Pylon_Beam_Rear"
              data-name="Pylon Beam Rear"
              className="cls-3"
              x1="278.81"
              y1="326.42"
              x2="271.5"
              y2="326.42"
            />
            <line
              id="Pylon_Beam_Front"
              data-name="Pylon Beam Front"
              className="cls-3"
              x1="278.81"
              y1="313.74"
              x2="271.86"
              y2="313.74"
            />
            <path
              id="Pylon-2"
              data-name="Pylon"
              className="cls-1"
              d="m278.97,346.89s-.17-33.71-.17-33.8c0-3.82-.21-10.05-3.43-10.05h0c-3.22,0-3.51,6.23-3.51,10.05,0,.08-1.11,40.73-1.11,40.73"
            />
          </g>
          <path
            id="Housing"
            className="cls-2"
            d="m296.14,332.83c.46-4.24,1.17-10.9,1.17-15.55,0-19.22-3.01-26.97-4.15-27.47-3.69-1.19-29.97-1.08-34.17,0-1.32.43-4.15,8.25-4.15,27.47s3.39,32.89,4.06,32.89c.08.08,12.46.04,12.46.04"
          />
        </g>
        <g id="ENG_1" data-name="ENG 1">
          <path
            id="Exhaust_Nozzle-2"
            data-name="Exhaust Nozzle"
            className="cls-1"
            d="m146.75,433.33c.28,3.12,1.43,7.96,2.12,9.66"
          />
          <path
            id="Inlet_Leading_Edge-2"
            data-name="Inlet Leading Edge"
            className="cls-1"
            d="m139.73,377.05c0-.95,38.11-.95,38.11,0"
          />
          <g id="Cowling-2" data-name="Cowling">
            <path
              id="Cowling_L_Rear_Edge-2"
              data-name="Cowling L Rear Edge"
              className="cls-3"
              d="m138.09,413.49c5.22.2,8.93.29,16.03.29"
            />
            <path
              id="Cowling_R_Rear_Edge-2"
              data-name="Cowling R Rear Edge"
              className="cls-3"
              d="m179.23,413.45c-5.67.22-10.86.34-17.54.33"
            />
            <path
              id="Cowling_L_Froward_Edge-2"
              data-name="Cowling L Froward Edge"
              className="cls-3"
              d="m137.81,391.05c5.1-.26,10.73-.42,17.15-.42"
            />
            <path
              id="Cowling_R_Foward_Edge-2"
              data-name="Cowling R Foward Edge"
              className="cls-3"
              d="m179.77,391.08c-5.1-.26-12.05-.45-18.48-.46"
            />
          </g>
          <path
            id="Strake-2"
            data-name="Strake"
            className="cls-3"
            d="m172.67,396.04c-.31,2.6-1.15,12.29-1.56,13.85.1.1,3.64.21,3.64.21.1-2.29-.83-12.08-2.08-14.06Z"
          />
          <g id="Pylon-3" data-name="Pylon">
            <line
              id="Pylon_Beam_Rear-2"
              data-name="Pylon Beam Rear"
              className="cls-3"
              x1="161.53"
              y1="409.53"
              x2="154.23"
              y2="409.53"
            />
            <line
              id="Pylon_Beam_Front-2"
              data-name="Pylon Beam Front"
              className="cls-3"
              x1="161.53"
              y1="396.85"
              x2="154.58"
              y2="396.85"
            />
            <path
              id="Pylon-4"
              data-name="Pylon"
              className="cls-1"
              d="m161.7,433.56s-.17-37.27-.17-37.36c0-3.82-.21-10.05-3.43-10.05h0c-3.22,0-3.51,6.23-3.51,10.05,0,.08-1.19,43.44-1.19,43.44"
            />
          </g>
          <path
            id="Housing-2"
            data-name="Housing"
            className="cls-2"
            d="m178.27,421.39s1.76-12.18,1.76-21c0-19.22-3.01-26.97-4.15-27.47-3.69-1.19-29.97-1.08-34.17,0-1.32.43-4.15,8.25-4.15,27.47s3.39,32.89,4.06,32.89c.08.08,12.46.04,12.46.04"
          />
        </g>
        <g id="Slats_Droop" data-name="Slats &amp;amp; Droop">
          <g id="Droop_Flaps" data-name="Droop Flaps">
            <polyline
              id="Droop_Box"
              data-name="Droop Box"
              className="cls-3"
              points="353.77 285.62 353.96 296.71 284.25 353.33 279.43 346.52"
            />
            <line id="Line" className="cls-3" x1="317.08" y1="315.58" x2="322.07" y2="322.61" />
          </g>
          <g id="L_Slats_Right" data-name="L Slats Right">
            <polyline
              id="Right_Slats_Box"
              data-name="Right Slats Box"
              className="cls-3"
              points="265.38 357.44 265.38 370.22 169.83 440.42 163.83 432"
            />
            <line
              id="Left_Line"
              data-name="Left Line"
              className="cls-3"
              x1="196.67"
              y1="408.08"
              x2="202.53"
              y2="416.4"
            />
            <line
              id="Right_Line"
              data-name="Right Line"
              className="cls-3"
              x1="229.42"
              y1="383.83"
              x2="235.76"
              y2="391.99"
            />
          </g>
          <g id="L_Slats_Left" data-name="L Slats Left">
            <polyline
              id="Left_Slats_Box"
              data-name="Left Slats Box"
              className="cls-3"
              points="147.81 443.76 147.81 456.25 26.56 542.94 21.89 536.11"
            />
            <line
              id="Left_Line-2"
              data-name="Left Line"
              className="cls-3"
              x1="66.22"
              y1="503.94"
              x2="71.16"
              y2="511.05"
            />
            <line
              id="Right_Line-2"
              data-name="Right Line"
              className="cls-3"
              x1="104.72"
              y1="475.56"
              x2="110.65"
              y2="482.82"
            />
          </g>
        </g>
        <g id="Ailerons">
          <polyline
            id="Box"
            className="cls-1"
            points="60.25 566.78 60.25 556.5 147.81 511.05 150.76 515.08 150.76 527.15"
          />
          <polyline
            id="Left_Line-3"
            data-name="Left Line"
            className="cls-3"
            points="100.44 549.18 100.44 538.92 99.15 536.31"
          />
          <polyline
            id="Right_Line-3"
            data-name="Right Line"
            className="cls-3"
            points="129.06 536.65 128.96 525.67 126.88 521.92"
          />
        </g>
        <g id="Flap_Fairings" data-name="Flap Fairings">
          <path
            id="Left_Flap_Fairing_5"
            data-name="Left Flap Fairing 5"
            className="cls-1"
            d="m328.22,457.77c.51,6.22,2.29,9.62,3.06,10.83.16.25.54.24.67-.03.62-1.21,1.98-4.65,2.7-12.53"
          />
          <path
            id="Left_Flap_Fairing_4"
            data-name="Left Flap Fairing 4"
            className="cls-1"
            d="m285.33,472.71c.43,6.81,1.92,9.99,2.56,11.07.15.25.5.28.68.05.88-1.07,2.94-4.55,2.48-13.42"
          />
          <path
            id="Left_Flap_Fairing_3"
            data-name="Left Flap Fairing 3"
            className="cls-1"
            d="m241.3,490.37c.29,15.36,2.22,23.87,2.96,26.6.09.34.57.37.7.04,1.15-2.83,4.29-12.18,4.29-29.83"
          />
          <path
            id="Left_Flap_Fairing_2"
            data-name="Left Flap Fairing 2"
            className="cls-1"
            d="m196.69,508.46c-.3,15.88,1.6,22.51,2.24,24.88.11.42.68.47.88.08,1.3-2.67,3.47-8.69,3.8-27.93"
          />
          <path
            id="Left_Flap_Fairing_1"
            data-name="Left Flap Fairing 1"
            className="cls-1"
            d="m150.76,527.15c.74,11.93,2.2,14.39,2.81,15.27.13.19.42.21.57.04.73-.84,2.31-6.08,2.69-17.97"
          />
        </g>
        <g id="Flaps_Spoilers" data-name="Flaps &amp;amp; Spoilers">
          <polyline
            id="Spoilers_Box"
            data-name="Spoilers Box"
            className="cls-1"
            points="385.42 442.37 385.42 409.67 309.67 430.42 160.5 503.75 159.37 523.38"
          />
          <polyline
            id="Flaps_Box"
            data-name="Flaps Box"
            className="cls-1"
            points="160.02 512.1 309.53 444.65 385.42 425.22"
          />
          <line
            id="Left_Spoiler_Line_1"
            data-name="Left Spoiler Line 1"
            className="cls-3"
            x1="193.76"
            y1="487.4"
            x2="196.57"
            y2="495.61"
          />
          <polyline
            id="Left_Spoiler_and_Flap_Line"
            data-name="Left Spoiler and Flap Line"
            className="cls-3"
            points="219.64 474.67 223.9 483.28 223.9 497.34"
          />
          <line
            id="Left_Spoiler_Line_2"
            data-name="Left Spoiler Line 2"
            className="cls-3"
            x1="245.28"
            y1="462.07"
            x2="249.46"
            y2="471.75"
          />
          <line
            id="Left_Spoiler_Line_3"
            data-name="Left Spoiler Line 3"
            className="cls-3"
            x1="265.6"
            y1="452.08"
            x2="270.4"
            y2="462.3"
          />
          <line
            id="Left_Spoiler_Line_4"
            data-name="Left Spoiler Line 4"
            className="cls-3"
            x1="289.83"
            y1="440.17"
            x2="295.65"
            y2="450.91"
          />
          <polyline
            id="Right_Spoiler_and_Flap_Line"
            data-name="Right Spoiler and Flap Line"
            className="cls-3"
            points="309.67 430.42 309.53 444.65 309.53 462.95"
          />
          <line
            id="Left_Spoiler_Line_5"
            data-name="Left Spoiler Line 5"
            className="cls-3"
            x1="332.33"
            y1="424.21"
            x2="335.97"
            y2="437.95"
          />
          <line
            id="Left_Spoiler_Line_6"
            data-name="Left Spoiler Line 6"
            className="cls-3"
            x1="358.67"
            y1="416.99"
            x2="362.86"
            y2="431.03"
          />
        </g>
        <path
          id="Walk_Zone"
          data-name="Walk Zone"
          className="cls-3"
          d="m393.89,268.25l-28.31,22.08v29.25l-79.42,39.67L19.25,550.17l8.33,15.17,276.33-141.32,63.83-17.85c-3.17-11.42-.64-18.81,21.1-26.86"
        />
        <path
          id="Left_Wing-2"
          data-name="Left Wing"
          className="cls-2"
          d="m387.83,441.72l-76.75,20.67-147.41,59.11L9.11,589.17c-1.53,7.08-2.78,20.56-3,20.56-.47,0,.15-18.57,1.64-46.72.39-6.33,4.08-19.17,11.25-24.67l253.33-186,104.17-85.33,15.11-15.72,2.28-9.61"
        />
      </g>
      <g id="Right_Wing" data-name="Right Wing">
        <g id="ENG_3" data-name="ENG 3">
          <path
            id="Exhaust_Nozzle-3"
            data-name="Exhaust Nozzle"
            className="cls-1"
            d="m602.86,350.22c-.28,3.12-.67,5.52-1.36,7.22"
          />
          <path
            id="Inlet_Leading_Edge-3"
            data-name="Inlet Leading Edge"
            className="cls-1"
            d="m609.88,293.94c0-.95-38.11-.95-38.11,0"
          />
          <g id="Cowling-3" data-name="Cowling">
            <path
              id="Cowling_R_Rear_Edge-3"
              data-name="Cowling R Rear Edge"
              className="cls-3"
              d="m611.53,330.38c-5.22.2-8.93.29-16.03.29"
            />
            <path
              id="Cowling_L_Rear_Edge-3"
              data-name="Cowling L Rear Edge"
              className="cls-3"
              d="m570.38,330.34c5.67.22,10.86.34,17.54.33"
            />
            <path
              id="Cowling_R_Froward_Edge"
              data-name="Cowling R Froward Edge"
              className="cls-3"
              d="m611.8,307.94c-5.1-.26-10.73-.42-17.15-.42"
            />
            <path
              id="Cowling_L_Foward_Edge"
              data-name="Cowling L Foward Edge"
              className="cls-3"
              d="m569.84,307.97c5.1-.26,12.05-.45,18.48-.46"
            />
          </g>
          <path
            id="Strake-3"
            data-name="Strake"
            className="cls-3"
            d="m576.94,312.93c.31,2.6,1.15,12.29,1.56,13.85-.1.1-3.64.21-3.64.21-.1-2.29.83-12.08,2.08-14.06Z"
          />
          <g id="Pylon-5" data-name="Pylon">
            <line
              id="Pylon_Beam_Rear-3"
              data-name="Pylon Beam Rear"
              className="cls-3"
              x1="588.08"
              y1="326.42"
              x2="595.38"
              y2="326.42"
            />
            <line
              id="Pylon_Beam_Front-3"
              data-name="Pylon Beam Front"
              className="cls-3"
              x1="588.08"
              y1="313.74"
              x2="595.03"
              y2="313.74"
            />
            <path
              id="Pylon-6"
              data-name="Pylon"
              className="cls-1"
              d="m587.91,346.89s.17-33.71.17-33.8c0-3.82.21-10.05,3.43-10.05h0c3.22,0,3.51,6.23,3.51,10.05,0,.08,1.11,40.73,1.11,40.73"
            />
          </g>
          <path
            id="Housing-3"
            data-name="Housing"
            className="cls-2"
            d="m570.75,332.83c-.46-4.24-1.17-10.9-1.17-15.55,0-19.22,3.01-26.97,4.15-27.47,3.69-1.19,29.97-1.08,34.17,0,1.32.43,4.15,8.25,4.15,27.47s-3.39,32.89-4.06,32.89c-.08.08-12.46.04-12.46.04"
          />
        </g>
        <g id="ENG_4" data-name="ENG 4">
          <path
            id="Exhaust_Nozzle-4"
            data-name="Exhaust Nozzle"
            className="cls-1"
            d="m720.14,433.33c-.28,3.12-1.43,7.96-2.12,9.66"
          />
          <path
            id="Inlet_Leading_Edge-4"
            data-name="Inlet Leading Edge"
            className="cls-1"
            d="m727.16,377.05c0-.95-38.11-.95-38.11,0"
          />
          <g id="Cowling-4" data-name="Cowling">
            <path
              id="Cowling_R_Rear_Edge-4"
              data-name="Cowling R Rear Edge"
              className="cls-3"
              d="m728.8,413.49c-5.22.2-8.93.29-16.03.29"
            />
            <path
              id="Cowling_L_Rear_Edge-4"
              data-name="Cowling L Rear Edge"
              className="cls-3"
              d="m687.66,413.45c5.67.22,10.86.34,17.54.33"
            />
            <path
              id="Cowling_R_Froward_Edge-2"
              data-name="Cowling R Froward Edge"
              className="cls-3"
              d="m729.08,391.05c-5.1-.26-10.73-.42-17.15-.42"
            />
            <path
              id="Cowling_L_Foward_Edge-2"
              data-name="Cowling L Foward Edge"
              className="cls-3"
              d="m687.12,391.08c5.1-.26,12.05-.45,18.48-.46"
            />
          </g>
          <path
            id="Strake-4"
            data-name="Strake"
            className="cls-3"
            d="m694.22,396.04c.31,2.6,1.15,12.29,1.56,13.85-.1.1-3.64.21-3.64.21-.1-2.29.83-12.08,2.08-14.06Z"
          />
          <g id="Pylon-7" data-name="Pylon">
            <line
              id="Pylon_Beam_Rear-4"
              data-name="Pylon Beam Rear"
              className="cls-3"
              x1="705.36"
              y1="409.53"
              x2="712.66"
              y2="409.53"
            />
            <line
              id="Pylon_Beam_Front-4"
              data-name="Pylon Beam Front"
              className="cls-3"
              x1="705.36"
              y1="396.85"
              x2="712.31"
              y2="396.85"
            />
            <path
              id="Pylon-8"
              data-name="Pylon"
              className="cls-1"
              d="m705.19,433.56s.17-37.27.17-37.36c0-3.82.21-10.05,3.43-10.05h0c3.22,0,3.51,6.23,3.51,10.05,0,.08,1.19,43.44,1.19,43.44"
            />
          </g>
          <path
            id="Housing-4"
            data-name="Housing"
            className="cls-2"
            d="m688.61,421.39s-1.76-12.18-1.76-21c0-19.22,3.01-26.97,4.15-27.47,3.69-1.19,29.97-1.08,34.17,0,1.32.43,4.15,8.25,4.15,27.47s-3.39,32.89-4.06,32.89c-.08.08-12.46.04-12.46.04"
          />
        </g>
        <g id="Slats_Droop-2" data-name="Slats &amp;amp; Droop">
          <g id="Droop_Flaps-2" data-name="Droop Flaps">
            <polyline
              id="Droop_Box-2"
              data-name="Droop Box"
              className="cls-3"
              points="513.12 285.62 512.93 296.71 582.64 353.33 587.46 346.52"
            />
            <line id="Line-2" data-name="Line" className="cls-3" x1="549.81" y1="315.58" x2="544.82" y2="322.61" />
          </g>
          <g id="R_Slats_Left" data-name="R Slats Left">
            <polyline
              id="Left_Slats_Box-2"
              data-name="Left Slats Box"
              className="cls-3"
              points="601.51 357.44 601.51 370.22 697.06 440.42 703.06 432"
            />
            <line
              id="Right_Line-4"
              data-name="Right Line"
              className="cls-3"
              x1="670.22"
              y1="408.08"
              x2="664.36"
              y2="416.4"
            />
            <line
              id="Left_Line-4"
              data-name="Left Line"
              className="cls-3"
              x1="637.47"
              y1="383.83"
              x2="631.13"
              y2="391.99"
            />
          </g>
          <g id="R_Slats_Right" data-name="R Slats Right">
            <polyline
              id="Right_Slats_Box-2"
              data-name="Right Slats Box"
              className="cls-3"
              points="719.08 443.76 719.08 456.25 840.33 542.94 845 536.11"
            />
            <line
              id="Right_Line-5"
              data-name="Right Line"
              className="cls-3"
              x1="800.67"
              y1="503.94"
              x2="795.73"
              y2="511.05"
            />
            <line
              id="Left_Line-5"
              data-name="Left Line"
              className="cls-3"
              x1="762.17"
              y1="475.56"
              x2="756.24"
              y2="482.82"
            />
          </g>
        </g>
        <g id="Ailerons-2" data-name="Ailerons">
          <polyline
            id="Box-2"
            data-name="Box"
            className="cls-1"
            points="806.64 566.78 806.64 556.5 719.08 511.05 716.13 515.08 716.13 527.15"
          />
          <polyline
            id="Right_Line-6"
            data-name="Right Line"
            className="cls-3"
            points="766.44 549.18 766.44 538.92 767.74 536.31"
          />
          <polyline
            id="Left_Line-6"
            data-name="Left Line"
            className="cls-3"
            points="737.82 536.65 737.93 525.67 740.01 521.92"
          />
        </g>
        <g id="Flap_Fairings-2" data-name="Flap Fairings">
          <path
            id="Right_Flap_Fairing_5"
            data-name="Right Flap Fairing 5"
            className="cls-1"
            d="m538.66,457.77c-.51,6.22-2.29,9.62-3.06,10.83-.16.25-.54.24-.67-.03-.62-1.21-1.98-4.65-2.7-12.53"
          />
          <path
            id="Right_Flap_Fairing_4"
            data-name="Right Flap Fairing 4"
            className="cls-1"
            d="m581.56,472.71c-.43,6.81-1.92,9.99-2.56,11.07-.15.25-.5.28-.68.05-.88-1.07-2.94-4.55-2.48-13.42"
          />
          <path
            id="Right_Flap_Fairing_3"
            data-name="Right Flap Fairing 3"
            className="cls-1"
            d="m625.59,490.37c-.29,15.36-2.22,23.87-2.96,26.6-.09.34-.57.37-.7.04-1.15-2.83-4.29-12.18-4.29-29.83"
          />
          <path
            id="Right_Flap_Fairing_2"
            data-name="Right Flap Fairing 2"
            className="cls-1"
            d="m670.2,508.46c.3,15.88-1.6,22.51-2.24,24.88-.11.42-.68.47-.88.08-1.3-2.67-3.47-8.69-3.8-27.93"
          />
          <path
            id="Right_Flap_Fairing_1"
            data-name="Right Flap Fairing 1"
            className="cls-1"
            d="m716.13,527.15c-.74,11.93-2.2,14.39-2.81,15.27-.13.19-.42.21-.57.04-.73-.84-2.31-6.08-2.69-17.97"
          />
        </g>
        <g id="Flaps_Spoilers-2" data-name="Flaps &amp;amp; Spoilers">
          <polyline
            id="Spoilers_Box-2"
            data-name="Spoilers Box"
            className="cls-1"
            points="481.47 442.37 481.47 409.67 557.22 430.42 706.39 503.75 707.52 523.38"
          />
          <polyline
            id="Flaps_Box-2"
            data-name="Flaps Box"
            className="cls-1"
            points="706.87 512.1 557.36 444.65 481.47 425.22"
          />
          <line
            id="Right_Spoiler_Line_1"
            data-name="Right Spoiler Line 1"
            className="cls-3"
            x1="673.13"
            y1="487.4"
            x2="670.32"
            y2="495.61"
          />
          <polyline
            id="Right_Spoiler_and_Flap_Line-2"
            data-name="Right Spoiler and Flap Line"
            className="cls-3"
            points="647.25 474.67 642.98 483.28 642.98 497.34"
          />
          <line
            id="Right_Spoiler_Line_2"
            data-name="Right Spoiler Line 2"
            className="cls-3"
            x1="621.61"
            y1="462.07"
            x2="617.43"
            y2="471.75"
          />
          <line
            id="Right_Spoiler_Line_3"
            data-name="Right Spoiler Line 3"
            className="cls-3"
            x1="601.29"
            y1="452.08"
            x2="596.48"
            y2="462.3"
          />
          <line
            id="Right_Spoiler_Line_4"
            data-name="Right Spoiler Line 4"
            className="cls-3"
            x1="577.06"
            y1="440.17"
            x2="571.24"
            y2="450.91"
          />
          <polyline
            id="Left_Spoiler_and_Flap_Line-2"
            data-name="Left Spoiler and Flap Line"
            className="cls-3"
            points="557.22 430.42 557.36 444.65 557.36 462.95"
          />
          <line
            id="Right_Spoiler_Line_5"
            data-name="Right Spoiler Line 5"
            className="cls-3"
            x1="534.56"
            y1="424.21"
            x2="530.92"
            y2="437.95"
          />
          <line
            id="Right_Spoiler_Line_6"
            data-name="Right Spoiler Line 6"
            className="cls-3"
            x1="508.22"
            y1="416.99"
            x2="504.03"
            y2="431.03"
          />
        </g>
        <path
          id="Walk_Zone-2"
          data-name="Walk Zone"
          className="cls-3"
          d="m473,268.25l28.31,22.08v29.25s79.42,39.67,79.42,39.67l266.92,190.92-8.33,15.17-276.33-141.32-63.83-17.85c3.17-11.42.64-18.81-21.1-26.86"
        />
        <path
          id="Right_Wing-2"
          data-name="Right Wing"
          className="cls-2"
          d="m479.06,441.72l76.75,20.67,147.41,59.11,154.56,67.67c1.53,7.08,2.78,20.56,3,20.56.47,0-.15-18.57-1.64-46.72-.39-6.33-4.08-19.17-11.25-24.67l-253.33-186-104.17-85.33-15.11-15.72-2.28-9.61"
        />
      </g>
    </g>
    <g id="Cockpit_Windows" data-name="Cockpit Windows">
      <path
        className="cls-3"
        d="m417.25,76.04l4.2.2c.07,0,.13-.03.17-.08l1.23-1.78s.02-.02.03-.04l1.34-1.19c.08-.07.09-.19.02-.27l-1.69-2.04c-.05-.06-.13-.08-.2-.06l-1.54.4s-.08.03-.1.07l-3.61,4.48c-.1.13-.02.31.14.32Z"
      />
      <path
        className="cls-3"
        d="m425.48,71.79l7-3.72c.06-.03.1-.1.1-.17v-2.86c0-.13-.12-.22-.24-.19l-3.33.77s-.05.02-.07.03l-4.76,3.46c-.06.04-.09.12-.08.19l.25,1.64s.03.09.07.12l.84.7c.06.05.15.06.22.02Z"
      />
      <path
        className="cls-3"
        d="m415.75,77.88l3.43-.46c.51-.07.84.54.49.92l-1.69,1.89s-.05.05-.08.07l-3.97,3.06c-.33.25-.81.07-.89-.33l-.2-1c-.03-.15,0-.3.09-.43l2.42-3.49c.09-.13.23-.21.38-.24Z"
      />
      <path
        className="cls-3"
        d="m449.64,76.04l-4.2.2c-.07,0-.13-.03-.17-.08l-1.23-1.78s-.02-.02-.03-.04l-1.34-1.19c-.08-.07-.09-.19-.02-.27l1.69-2.04c.05-.06.13-.08.2-.06l1.54.4s.08.03.1.07l3.61,4.48c.1.13.02.31-.14.32Z"
      />
      <path
        className="cls-3"
        d="m441.41,71.79l-7-3.72c-.06-.03-.1-.1-.1-.17v-2.86c0-.13.12-.22.24-.19l3.33.77s.05.02.07.03l4.76,3.46c.06.04.09.12.08.19l-.25,1.64s-.03.09-.07.12l-.84.7c-.06.05-.15.06-.22.02Z"
      />
      <path
        className="cls-3"
        d="m451.14,77.88l-3.43-.46c-.51-.07-.84.54-.49.92l1.69,1.89s.05.05.08.07l3.97,3.06c.33.25.81.07.89-.33l.2-1c.03-.15,0-.3-.09-.43l-2.42-3.49c-.09-.13-.23-.21-.38-.24Z"
      />
    </g>
    <g id="MainDeckDoors">
      <g id="Foward_Doors">
        <path
          id="FWD_R_Door"
          d="M 468.137 115.921 L 463.188 115.921 C 462.139 115.921 461.298 115.335 461.298 114.607 L 461.298 108.837 C 461.298 108.109 462.148 107.523 463.188 107.523 L 466.762 107.523"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: 'none',
            strokeMiterlimit: 10,
          }}
        />
        <path
          id="FWD_L_Door"
          d="M 399.649 115.901 L 404.948 115.901 C 406.045 115.901 406.925 115.318 406.925 114.594 L 406.925 108.85 C 406.925 108.126 406.036 107.543 404.948 107.543 L 400.831 107.543"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: main1LeftStatus ? '#6bbe45' : 'none',
            strokeMiterlimit: 10,
          }}
        />
      </g>
      <g id="Mid_Foward_Doors">
        <path
          id="MID-FWD_R_Door"
          d="M 473.644 213.235 L 467.382 213.235 C 466.535 213.235 465.846 212.641 465.846 211.904 L 465.846 206.057 C 465.846 205.319 466.535 204.725 467.382 204.725 L 473.644 204.725"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: 'none',
            strokeMiterlimit: 10,
          }}
        />
        <path
          id="MID-FWD_L_Door"
          d="M 394.349 213.22 L 400.935 213.22 C 401.812 213.22 402.526 212.628 402.526 211.894 L 402.526 206.067 C 402.526 205.332 401.812 204.74 400.935 204.74 L 394.349 204.74"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: main2LeftStatus ? '#6bbe45' : 'none',
            strokeMiterlimit: 10,
          }}
        />
      </g>
      <g id="Mid_Aft_Doors">
        <path
          id="MID-AFT_R_Door"
          d="M 473.407 518.471 L 467.051 518.471 C 466.192 518.471 465.493 517.878 465.493 517.141 L 465.493 511.303 C 465.493 510.566 466.192 509.973 467.051 509.973 L 473.407 509.973"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: 'none',
            strokeMiterlimit: 10,
          }}
        />
        <path
          id="MID-AFT_L_Door"
          d="M 394.115 518.465 L 400.659 518.465 C 401.531 518.465 402.24 517.873 402.24 517.137 L 402.24 511.307 C 402.24 510.571 401.531 509.979 400.659 509.979 L 394.115 509.979"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: 'none',
            strokeMiterlimit: 10,
          }}
        />
      </g>
      <g id="Aft_Doors">
        <path
          id="AFT_R_Door"
          d="M 471.609 614.707 L 464.803 614.707 C 463.768 614.707 462.938 614.12 462.938 613.391 L 462.938 607.613 C 462.938 606.884 463.777 606.297 464.803 606.297 L 472.243 606.297"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: main4RightStatus ? '#6bbe45' : 'none',
            strokeMiterlimit: 10,
          }}
        />
        <path
          id="AFT_L_Door"
          d="M 395.958 614.687 L 403.083 614.687 C 404.168 614.687 405.038 614.102 405.038 613.377 L 405.038 607.627 C 405.038 606.902 404.159 606.317 403.083 606.317 L 395.303 606.317"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: 'none',
            strokeMiterlimit: 10,
          }}
        />
      </g>
    </g>
    <g id="UpperDeckDoors">
      <g id="Forward_Upper_Doors">
        <path
          id="FWD-UPP_R_Door"
          className="cls-5"
          d="M 465.576 250.91 L 459.258 250.91 C 458.397 250.91 457.704 250.33 457.704 249.61 L 457.704 243.9 C 457.704 243.179 458.397 242.599 459.258 242.599 L 465.576 242.599"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: 'none',
            strokeMiterlimit: 10,
          }}
        />
        <path
          id="FWD-UPP_L_Door"
          className="cls-5"
          d="M 402.351 250.91 L 408.771 250.91 C 409.632 250.91 410.325 250.33 410.325 249.61 L 410.325 243.9 C 410.325 243.179 409.632 242.599 408.771 242.599 L 402.351 242.599"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: upper1LeftStatus ? '#6bbe45' : 'none',
            strokeMiterlimit: 10,
          }}
        />
      </g>
      <g id="Mid_Upper_Doors">
        <path
          id="MID-UPP_R_Door"
          className="cls-5"
          d="M 465.576 463.696 L 459.258 463.696 C 458.397 463.696 457.704 463.116 457.704 462.396 L 457.704 456.685 C 457.704 455.965 458.397 455.385 459.258 455.385 L 465.576 455.385"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: 'none',
            strokeMiterlimit: 10,
          }}
        />
        <path
          id="MID-UPP_L_Door"
          className="cls-5"
          d="M 402.351 463.696 L 408.771 463.696 C 409.632 463.696 410.325 463.116 410.325 462.396 L 410.325 456.685 C 410.325 455.965 409.632 455.385 408.771 455.385 L 402.351 455.385"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: 'none',
            strokeMiterlimit: 10,
          }}
        />
      </g>
      <g id="Aft_Upper_Doors">
        <path
          id="AFT-UPP_R_Door"
          className="cls-5"
          d="M 465.576 562.508 L 459.258 562.508 C 458.397 562.508 457.704 561.928 457.704 561.208 L 457.704 555.497 C 457.704 554.777 458.397 554.197 459.258 554.197 L 465.576 554.197"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: 'none',
            strokeMiterlimit: 10,
          }}
        />
        <path
          id="AFT-UPP_L_Door"
          data-name="AFT-UPP L Door"
          className="cls-5"
          d="M 402.351 562.508 L 408.771 562.508 C 409.632 562.508 410.325 561.928 410.325 561.208 L 410.325 555.497 C 410.325 554.777 409.632 554.197 408.771 554.197 L 402.351 554.197"
          style={{
            stroke: '#6bbe45',
            strokeWidth: 2,
            fill: 'none',
            strokeMiterlimit: 10,
          }}
        />
      </g>
    </g>
  </svg>
);
