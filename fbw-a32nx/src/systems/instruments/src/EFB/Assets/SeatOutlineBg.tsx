/* eslint-disable max-len */
import React from 'react';

interface SeatOutlineBgProps {
    stroke: string;
    highlight: string;
}

export const SeatOutlineBg = ({ stroke, highlight }: SeatOutlineBgProps) => (
    <svg id="Plane" xmlns="http://www.w3.org/2000/svg" x={0} y={0} viewBox="0 0 657 150" xmlSpace="preserve" fill="none">
        <g id="GALLEY___LAVATORY___WALLS">
            <path id="Cockpit_Door" className="st0" stroke="#D2D3D4" strokeWidth={0.5} strokeMiterlimit={10} d="M86.7 82.1V67.9" />
            <g id="Walls">
                <path id="Aft_Wall" className="st1" stroke={stroke} strokeWidth={0.5} strokeMiterlimit={10} d="M681.4 105.1V45" />
                <path id="Fwd_Right_Wall" className="st1" stroke={stroke} strokeWidth={0.5} strokeMiterlimit={10} d="M119.4 33v34.9h-1.8V33" />
                <path id="Fwd_Left_Wall" className="st1" stroke={stroke} strokeWidth={0.5} strokeMiterlimit={10} d="M117.6 117.1V81.9h1.8v35.2" />
            </g>
            <g id="Lavatories">
                <path id="Aft_Left_Lavatory" className="st0" stroke="#D2D3D4" strokeWidth={0.5} strokeMiterlimit={10} d="M610.8 116.3V81.9h21.7v14.8h-3.1v17.4" />
                <path id="Aft_Right_Lavatory" className="st0" stroke="#D2D3D4" strokeWidth={0.5} strokeMiterlimit={10} d="M629.4 36v17.4h3.1v14.8h-21.7V33.7" />
                <path id="Fwd_Lavatory" className="st0" stroke="#D2D3D4" strokeWidth={0.5} strokeMiterlimit={10} d="M78 113.5V81.9h23.4v19.5h-3.3v14.9" />
            </g>
            <g id="Galleys">
                <path id="Aft_Galley" className="st1" stroke={stroke} strokeWidth={0.5} strokeMiterlimit={10} d="M654.2 110.2V97.9h3.3v-48h-3.3V39.8" />
                <path id="Fwd_Galley" className="st0" stroke="#D2D3D4" strokeWidth={0.5} strokeMiterlimit={10} d="M97.7 33.8v34.1H79.3V36.3" />
            </g>
        </g>
        <g id="SVG">
            <g id="SVG_Detail_Lines">
                <g id="Engines">
                    <g id="ENG_1">
                        <g id="Strakes">
                            <path id="Outer_Strake" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="m264 217.6 21.3-1.4.4 6.7c-8.5-.6-16.4-2.2-21.7-5.3z" />
                            <path id="Inner_Strake" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="m264 186.4 21.3 1.4.4-6.7c-8.5.6-16.4 2.2-21.7 5.3z" />
                        </g>
                        <g id="Reverser_Door">
                            <path id="Outer_Side" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M294.1 206.3c0 7.9-.1 14.4-.7 19.8" />
                            <path id="Inner_Side" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M294.1 197.7c0-7.9-.1-14.4-.7-19.8" />
                        </g>
                        <g id="Engine_Mount">
                            <g id="Connections">
                                <path id="Fan_Connection" className="st3" stroke="#D1D3D4" strokeWidth={0.5} strokeMiterlimit={10} d="m260.1 224.9-2.3-.4c-1.5-15-1.5-30 0-45l2.3-.4" />
                                <path id="Middle_Connection" className="st3" stroke="#D1D3D4" strokeWidth={0.5} strokeMiterlimit={10} d="M250.8 202h5.8" />
                            </g>
                            <g id="Mounts">
                                <path id="Left_Mount" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M294.1 208.2h-37.5" />
                                <path id="Right_Mount" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M294.1 195.9h-37.4" />
                                <path id="Front_Mount" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M258.9 208.2v-12.3" />
                            </g>

                        </g>
                        <path id="Wing_Mount" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="m320 190.6 4 7.6 9.6 10" />
                    </g>
                    <g id="ENG_2">
                        <g id="Strakes-2">
                            <path id="Outer_Strake-2" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="m264-67.7 21.3 1.4.4-6.7c-8.5.6-16.4 2.2-21.7 5.3z" />
                            <path id="Inner_Strake-2" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="m264-36.6 21.3-1.4.4 6.7c-8.5-.6-16.4-2.2-21.7-5.3z" />
                        </g>
                        <g id="Reverser_Door-2">
                            <path id="Outer_Side-2" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M294.1-56.5c0-7.9-.1-14.4-.7-19.8" />
                            <path id="Inner_Side-2" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M294.1-47.8c0 7.9-.1 14.4-.7 19.8" />
                        </g>
                        <g id="Engine_Mount-2">
                            <g id="Connections-2">
                                <path id="Fan_Connection-2" className="st3" stroke="#D1D3D4" strokeWidth={0.5} strokeMiterlimit={10} d="m260.1-75-2.3.4c-1.5 15-1.5 30 0 45l2.3.4" />
                                <path id="Middle_Connection-2" className="st3" stroke="#D1D3D4" strokeWidth={0.5} strokeMiterlimit={10} d="M250.8-52.1h5.8" />
                            </g>
                            <g id="Mounts-2">
                                <path id="Right_Mount-2" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M294.1-58.3h-37.5" />
                                <path id="Left_Mount-2" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M294.1-46h-37.4" />
                                <path id="Front_Mount-2" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M258.9-58.3V-46" />
                            </g>

                        </g>
                        <path id="Wing_Mount-2" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="m320-40.7 4-7.6 8.6-9.2" />
                    </g>
                </g>
                <g id="Emergency_Lines">
                    <path id="Left_Emergency_Marks" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M305.2 117.1v20.5c0 3.5 2.8 6.3 6.3 6.3h84.6" />
                    <path id="Right_Emergency_Marks" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M305.2 33.1V12.5c0-3.5 2.8-6.3 6.3-6.3h84.6" />
                </g>
                <g id="Wing_Layers">
                    <path id="Left_Wing_Markings" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M290.5 117.1 448 427.9h11.9L372.5 208l-12.2-64.1" />
                    <path id="Right_Wing_Markings" className="st2" stroke="#CCCCCC" strokeWidth={0.5} strokeMiterlimit={10} d="M290.9 33.1 449-279h11.4L372.5-57.9 360.3 6.2" />
                </g>
                <g id="Doors">
                    <g id="Rear_Doors">
                        <path id="AFT_Left_PS_PSS" className="st4" stroke={highlight} strokeMiterlimit={10} d="M648.4 111.2v-5.1c0-1.5-1.4-2.7-2.9-2.5l-11.8 1.5c-1.3.2-2.2 1.3-2.2 2.5v6.2" />
                        <path id="AFT_Right_CAT" className="st4" stroke={highlight} strokeMiterlimit={10} d="M648.4 38.8v5.1c0 1.5-1.4 2.7-2.9 2.5l-11.8-1.5c-1.3-.2-2.2-1.3-2.2-2.5v-6.2" />
                    </g>
                    <g id="Emergency_Doors">
                        <path id="AFT_Left_EMG" className="st4" stroke={highlight} strokeMiterlimit={10} d="M335.8 117.1V114c0-1-.8-1.7-1.7-1.7h-7.6c-1 0-1.7.8-1.7 1.7v3.1" />
                        <path id="FWD_Left_EMG" className="st4" stroke={highlight} strokeMiterlimit={10} d="M317.5 117.1V114c0-1-.8-1.7-1.7-1.7h-7.6c-1 0-1.7.8-1.7 1.7v3.1" />
                        <path id="AFT_Right_EMG" className="st4" stroke={highlight} strokeMiterlimit={10} d="M335.8 33v3.1c0 1-.8 1.7-1.7 1.7h-7.6c-1 0-1.7-.8-1.7-1.7V33" />
                        <path id="FWD_Right_EMG" className="st4" stroke={highlight} strokeMiterlimit={10} d="M317.5 33v3.1c0 1-.8 1.7-1.7 1.7h-7.6c-1 0-1.7-.8-1.7-1.7V33" />
                    </g>
                    <g id="Front_Doors">
                        <path id="FWD_Right_CAT" className="st4" stroke={highlight} strokeMiterlimit={10} d="M116.3 33v9.1c0 1.5-1.2 2.7-2.7 2.7h-11.7c-1.5 0-2.7-1.2-2.7-2.7v-8.4" />
                        <path id="FWD_Left_PS_PSS" className="st4" stroke={highlight} strokeMiterlimit={10} d="M116.3 117.1V108c0-1.5-1.2-2.7-2.7-2.7h-11.7c-1.5 0-2.7 1.2-2.7 2.7v8.4" />
                    </g>
                </g>
            </g>
            <g id="SVG_Main_Lines">
                <g id="Rear_Stablizer">
                    <g id="Right_Fin">
                        <path id="Right_Elevator" className="st5" stroke={stroke} strokeMiterlimit={10} d="m767.9 53.5-21.4-3.1 38.6-109.9" />
                        <path id="Right_Fin_Outline" className="st6" stroke={stroke} strokeWidth="2" strokeMiterlimit={10} d="M767.5 58.2c-.1-3.3.7-7.1 1-8.2 1-4 24.5-109.6 24.5-109.6h-12.3c-6.2 0-14.4 1.2-18 6.9.2-.1-55.2 86.6-55.2 86.6-3.3 5.1-6.8 10.2-16.6 12.7" />
                    </g>
                    <g id="Left_Fin">
                        <path id="Left_Elevator" className="st5" stroke={stroke} strokeMiterlimit={10} d="m767.9 96.6-21.4 3 38.6 110" />
                        <path id="Left_Fin_Outline" className="st6" stroke={stroke} strokeWidth="2" strokeMiterlimit={10} d="M767.5 91.8c-.1 3.3.7 7.1 1 8.2 1 4 24.5 109.6 24.5 109.6h-12.3c-6.2 0-14.4-1.2-18-6.9.2.1-55.2-86.6-55.2-86.6-3.3-5.1-6.8-10.2-16.6-12.7" />
                    </g>
                </g>
                <g id="Wings">
                    <g id="Right_Wing">
                        <g id="Right_Slats">
                            <path id="Inner_Slats" className="st5" stroke={stroke} strokeMiterlimit={10} d="M281.7 26.9h10.4l33.1-64.1-7.8-4.6" />
                            <g id="Main_Slats">
                                <path id="Outer_Divider" className="st5" stroke={stroke} strokeMiterlimit={10} d="m421.7-228.8-5.6-3.3" />
                                <path id="Middle_Divider" className="st5" stroke={stroke} strokeMiterlimit={10} d="m393.9-173.8-6.1-3.8" />
                                <path id="Inner_Divider" className="st5" stroke={stroke} strokeMiterlimit={10} d="m366.3-119.2-6.9-3.6" />
                                <path id="Main_Slats_Outline" className="st5" stroke={stroke} strokeMiterlimit={10} d="m439.5-277.1 4.9 3.3L335.1-57.5h-9.7" />
                            </g>

                        </g>
                        <g id="Right_Wing_Flap_Fairings">
                            <path id="Outer" className="st5" stroke={stroke} strokeMiterlimit={10} d="M445.3-182.1c8.9.4 18.1-2.8 18.1-2.8s-8.9-2.6-16.3-2.9" />
                            <path id="Middle" className="st5" stroke={stroke} strokeMiterlimit={10} d="M420.3-102.3c6.8.2 17.3-3 17.3-3s-10.9-3-15.4-3.2" />
                            <path id="Inner" className="st5" stroke={stroke} strokeMiterlimit={10} d="M408.1-27.2c6.6 0 15.3-3.2 15.3-3.2s-9.3-2.7-15.3-2.7" />
                        </g>
                        <g id="Right_Flaps">
                            <path id="Flap_Divider" className="st5" stroke={stroke} strokeMiterlimit={10} d="M408.3-63.8H397" />
                            <path id="Flap_Outline" className="st5" stroke={stroke} strokeMiterlimit={10} d="M396.1 33v-94.5l56.6-156.1h3.6" />
                        </g>
                        <g id="Right_Spoilers">
                            <path id="Inner_Spoiler" className="st5" stroke={stroke} strokeMiterlimit={10} d="M396.1-31.1h-13.9v-30.4h13.9" />
                            <g id="Main_Spoilers">
                                <path id="Outer_Divider-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="m437.6-176-13.8-5" />
                                <path id="Middle_Divider-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="m425.9-143.6-13.7-5.3" />
                                <path id="Inner_Divider-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="m412.7-107.2-13.7-5.3" />
                                <path id="Main_Spoiler_Outline" className="st5" stroke={stroke} strokeMiterlimit={10} d="m399.6-71.2-13.2-6.4 49.1-135.8 14 4.7" />
                            </g>

                        </g>
                        <path id="Right_Aileron" className="st5" stroke={stroke} strokeMiterlimit={10} d="M475.2-279h-13.4l-20.2 56.2 2.8 1.4h12.7" />
                        <g id="ENG_2-2">
                            <path id="Engine_Mount-3" className="st5" stroke={stroke} strokeMiterlimit={10} d="M320.1-47.8h-47.4c-5.5 0-10.5-1.3-10.5-4.3s5-4.3 10.5-4.3h51.9" />
                            <path id="Engine" className="st6" stroke={stroke} strokeWidth="2" strokeMiterlimit={10} d="M318.3-56.5V-72c0-.6-.4-1.2-1-1.3-3.8-.7-17.8-3.1-34.2-3.1-19.3 0-31 1.9-32.5 3-2.3 1.7-3.9 4.6-3.9 21.2v.2c0 16.6 1.7 19.5 3.9 21.2 1.5 1.1 13.2 3 32.5 3 11.3 0 21.4-1.1 27.8-2.1" />
                            <path id="Exhaust" className="st5" stroke={stroke} d="M318.3-66.8s8.4 2 10 3.3" />
                            <path id="Engine_Inner_end" className="st6" stroke={stroke} strokeWidth="2" strokeMiterlimit={10} d="M318.3-44.2v-3.6" />
                            <path id="Cowling" className="st5" stroke={stroke} strokeMiterlimit={10} d="M253.9-30.3c-4.1 0-4.1-43.6 0-43.6" />
                        </g>
                        <path id="Right_Wing_Outliine" className="st6" stroke={stroke} strokeWidth="2" strokeMiterlimit={10} d="M408.1 33v-96.1l70.3-225s14.2-4 14.2-5.7-29.4 3.6-30.6 3.7c0 0-17.5 2.7-23.3 13.8S281.1 27.6 281.1 27.6c-1.6 2.6-30 5.4-30 5.4" />
                    </g>
                    <g id="Left_Wing">
                        <g id="Left_Slats">
                            <path id="Inner_Slats-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="M281.7 123.6h10.4l33.1 64.2-7.8 4.5" />
                            <g id="Main_Slats-2">
                                <path id="Outer_Divider-3" className="st5" stroke={stroke} strokeMiterlimit={10} d="m421.7 379.3-5.6 3.3" />
                                <path id="Middle_Divider-3" className="st5" stroke={stroke} strokeMiterlimit={10} d="m393.9 324.4-6.1 3.7" />
                                <path id="Inner_Divider-3" className="st5" stroke={stroke} strokeMiterlimit={10} d="m366.3 269.7-6.9 3.7" />
                                <path id="Main_Slats_Outline-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="m439.5 427.6 4.9-3.3L335.1 208h-9.7" />
                            </g>

                        </g>
                        <g id="Left_Wing_Flap_Fairings">
                            <path id="Outer-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="M445.3 332.1c8.9-.4 18.1 2.8 18.1 2.8s-8.9 2.6-16.3 2.9" />
                            <path id="Middle-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="M420.3 252.3c6.8-.1 17.3 3 17.3 3s-10.9 3-15.4 3.2" />
                            <path id="Inner-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="M408.1 177.2c6.6 0 15.3 3.2 15.3 3.2s-9.3 2.7-15.3 2.7" />
                        </g>
                        <g id="Left_Flaps">
                            <path id="Flap_Divider-2" className="st5" d="M408.3 213.8H397" stroke={stroke} strokeMiterlimit={10} />
                            <path id="Flap_Outline-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="M396.1 117.1v94.4l56.6 156.1h3.6" />
                        </g>
                        <g id="Left_Spoilers">
                            <path id="Inner_Spoiler-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="M396.1 181.1h-13.9v30.3l13.9.1" />
                            <g id="Main_Spoilers-2">
                                <path id="Outer_Divider-4" className="st5" stroke={stroke} strokeMiterlimit={10} d="m437.6 326-13.8 5" />
                                <path id="Middle_Divider-4" className="st5" stroke={stroke} strokeMiterlimit={10} d="m425.9 293.6-13.7 5.3" />
                                <path id="Inner_Divider-4" className="st5" stroke={stroke} strokeMiterlimit={10} d="m412.7 257.2-13.7 5.3" />
                                <path id="Main_Spoilers_Outline" className="st5" stroke={stroke} strokeMiterlimit={10} d="m399.6 221.2-13.2 6.4 49.1 135.7 14-4.6" />
                            </g>

                        </g>
                        <path id="Left_Aileron" className="st5" stroke={stroke} strokeMiterlimit={10} d="M475.2 427.9h-13.4l-20.2-56.3 2.8-1.3h12.7" />
                        <g id="ENG_1-2">
                            <path id="Engine_Mount-4" className="st5" stroke={stroke} strokeMiterlimit={10} d="M320.1 197.7h-47.4c-5.5 0-10.5 1.3-10.5 4.3s5 4.3 10.5 4.3h51.9" />
                            <path id="Engine-2" className="st6" stroke={stroke} strokeWidth="2" strokeMiterlimit={10} d="M318.3 206.3v15.5c0 .6-.4 1.1-1 1.3-3.8.7-17.8 3.1-34.2 3.1-19.3 0-31-1.9-32.5-3-2.3-1.7-3.9-4.6-3.9-21.2v-.1c0-16.6 1.7-19.5 3.9-21.2 1.5-1.1 13.2-3 32.5-3 11.3 0 21.4 1.1 27.8 2.1" />
                            <path id="Exhaust-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="M318.3 216.7s8.4-2 10-3.3" />
                            <path id="Engine_Inner_end-2" className="st6" stroke={stroke} strokeWidth="2" strokeMiterlimit={10} d="M318.3 194.1v3.6" />
                            <path id="Cowling-2" className="st5" stroke={stroke} strokeMiterlimit={10} d="M253.9 223.8c-4.1 0-4.1-43.6 0-43.6" />
                        </g>
                        <path id="Left_Wing_Outline" className="st6" stroke={stroke} strokeWidth="2" strokeMiterlimit={10} d="M408.1 117.1v96.1l70.3 225s14.2 4 14.2 5.7-29.4-3.6-30.6-3.7c0 0-17.5-2.6-23.3-13.8-5.8-11.2-157.6-303.8-157.6-303.8-1.6-2.6-30-5.4-30-5.4" />
                    </g>
                </g>
                <g id="Fuselage">
                    <path id="APU_Exhaust" className="st5" stroke={stroke} strokeMiterlimit={10} d="m808 78.9-.1-.6c-.3-2.3-.3-4.7.1-7v-.1" />
                    <g id="Cockpit_Windows">
                        <g id="Cockpit_Windows_Left">
                            <path className="st5" stroke={stroke} strokeMiterlimit={10} d="m45.4 89.8-6.9-12.2c-.2-.4-.6-.6-1-.6h-7c-.9 0-1.5 1-1 1.8l10 14.7c.4.6 1.2.8 1.8.3l3.8-2.7c.4-.3.5-.9.3-1.3zM42.8 96.1l2.5-2.1c.3-.2.6-.3.9-.3h2.4c.3 0 .6.1.9.2l5.7 3.4c.4.2.7.7.7 1.1v3.7c0 .6-.5 1.1-1.1 1.1h-.5c-.3 0-.6-.1-.8-.2L43 97.5c-.7-.2-.7-1-.2-1.4zM59.5 98.9l6.5 2.6c.2.1.3.2.5.3l3.5 3c.6.5 1 1.3 1 2.1v1.2c0 .9-.9 1.5-1.7 1.2l-10.1-4.2c-.4-.2-.7-.6-.7-1.1v-4.4c0-.5.5-.9 1-.7z" />
                        </g>
                        <g id="Cockpit_Windows_Right">
                            <path className="st5" stroke={stroke} strokeMiterlimit={10} d="m45.4 60.3-6.9 12.2c-.2.4-.6.6-1 .6h-7c-.9 0-1.5-1-1-1.8l10-14.7c.4-.6 1.2-.8 1.8-.3l3.8 2.7c.4.3.5.9.3 1.3zM42.8 54l2.5 2.1c.3.2.6.3.9.3h2.4c.3 0 .6-.1.9-.2l5.7-3.4c.4-.2.7-.7.7-1.1V48c0-.6-.5-1.1-1.1-1.1h-.5c-.3 0-.6.1-.8.2L43 52.6c-.7.2-.7 1-.2 1.4zM59.5 51.2l6.5-2.6c.2-.1.3-.2.5-.3l3.5-3c.6-.5 1-1.3 1-2.1V42c0-.9-.9-1.5-1.7-1.2L59.2 45c-.4.2-.7.6-.7 1.1v4.4c0 .5.5.9 1 .7z" />
                        </g>
                    </g>
                    <path id="Fuselage_Outline" className="st6" stroke={stroke} strokeWidth="2" strokeMiterlimit={10} d="M1.2 75c0-3.8 3.3-8.5 10.7-13.4 17.9-11.9 36.9-18.4 58.2-23.5C87.8 34 104.4 33 117.5 33h478.7c34.5 0 114 18 114 18l19.2 3.7c.5.1 1 .2 1.6.2l16.3.6c9.8.6 20.1 2.6 32.6 6 11.4 3.1 24.1 5.9 30.1 11.1.1.1.2.3.2.5v4c0 .2-.1.4-.2.5-6 5.2-18.7 8-30.1 11.1-12.4 3.4-22.7 5.4-32.6 6l-16.3.5c-.5 0-1 .1-1.6.2l-19.2 3.7s-79.5 18-114 18H117.5c-13 0-29.7-1-47.3-5.2-21.3-5.1-40.3-11.6-58.2-23.5C4.5 83.5 1.2 78.9 1.2 75z" />
                </g>
            </g>
        </g>
    </svg>
);
