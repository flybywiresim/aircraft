import React, { useEffect, useState } from "react";
import { useSimVar } from "@instruments/common/simVars";
import { Navbar } from "../Components/Navbar";
import { ChecklistPage, ChecklistState } from "./ChecklistPage";
import { CHECKLISTS, mapFlightPhaseToChecklist } from "./Lists";
import "./Checklist.css";
import { ChecklistItemState } from "./ChecklistItem";

const INITIAL_ITEM_STATES: ChecklistState[] = Array.from(
    { length: CHECKLISTS.length },
    (v, i) => {
        return {
            itemStates: Array.from(
                { length: CHECKLISTS[i].items.length },
                (vv, ii) => {
                    return {
                        checked:
                            CHECKLISTS[i].items[ii].item === "" ? true : false,
                        overwritten: false,
                    };
                }
            ),
        };
    }
);
const INITIAL_CHECKLIST_STATES: boolean[] = Array.from(
    { length: CHECKLISTS.length },
    () => false
);

export const Checklists = () => {
    const [simFlightPhase] = useSimVar(
        "L:A32NX_FMGC_FLIGHT_PHASE",
        "number",
        0
    );
    const [currentChecklistIdx, setCurrentChecklistIdx] = useState<number>(
        mapFlightPhaseToChecklist(simFlightPhase) === -1
            ? 0
            : mapFlightPhaseToChecklist(simFlightPhase)
    );
    const [flightPhase, setFlightPhase] = useState(simFlightPhase);
    const [checklistItemState, setChecklistItemState] = useState<
        ChecklistState[]
    >(INITIAL_ITEM_STATES);
    const [checklistState, setChecklistState] = useState<boolean[]>(
        INITIAL_CHECKLIST_STATES
    );

    useEffect(() => {
        if (simFlightPhase !== flightPhase) {
            const newChecklist = mapFlightPhaseToChecklist(simFlightPhase);
            if (-1 !== newChecklist) {
                setCurrentChecklistIdx(newChecklist);
            }
            setFlightPhase(simFlightPhase);
        }
    }, [simFlightPhase]);

    // Checklist conditions have to be evaluated everytime in the same order as the conditions uses useSimVar and this
    // makes use of useState() that always needs to be called in the same order for each redraw
    const setAutomaticItemStates = () => {
        CHECKLISTS.forEach((cl, clIdx) => {
            cl.items.forEach((it, itIdx) => {
                if (it.condition !== undefined) {
                    const condEval = it.condition();
                    if (
                        false === checklistState[clIdx] &&
                        false ===
                            checklistItemState[clIdx].itemStates[itIdx]
                                .overwritten
                    ) {
                        // do not overwrite status for completed checklists
                        checklistItemState[clIdx].itemStates[
                            itIdx
                        ].checked = condEval;
                    }
                }
            });
        });
    };
    setAutomaticItemStates();

    const handleClick = (index: number) => {
        setCurrentChecklistIdx(index);
    };

    const setItemState = (itemIdx: number, newValue: ChecklistItemState) => {
        checklistItemState[currentChecklistIdx].itemStates[itemIdx] = newValue;
        console.log(
            `checklistItemState[${currentChecklistIdx}]=${JSON.stringify(
                checklistItemState[currentChecklistIdx]
            )}`
        );
        setChecklistItemState(checklistItemState);
    };

    const setChecklistCompleteStatus = (
        complete: boolean,
        resetOverwrite: boolean
    ) => {
        checklistState[currentChecklistIdx] = complete;
        setChecklistState(checklistState);
        if (false === complete) {
            checklistItemState[currentChecklistIdx].itemStates.forEach(
                (it, idx) => {
                    if (
                        CHECKLISTS[currentChecklistIdx].items[idx].item !== ""
                    ) {
                        it.checked = false;
                        if (resetOverwrite) it.overwritten = false;
                    }
                }
            );
            setChecklistItemState(checklistItemState);
        }
    };

    const setChecklistComplete = () => {
        setChecklistCompleteStatus(true, false);
    };
    const resetChecklist = () => {
        setChecklistCompleteStatus(false, true);
    };

    const CHECKLIST_NAMES = CHECKLISTS.map((cl, idx) => {
        const color = true === checklistState[idx] ? "text-green-500" : "";
        return <span className={color}>{cl.name}</span>;
    });

    return (
        <>
            <h1 className="text-3xl pt-6 text-white">Checklists</h1>
            <Navbar
                tabs={CHECKLIST_NAMES}
                onSelected={(index) => handleClick(index)}
            />
            <ChecklistPage
                items={CHECKLISTS[currentChecklistIdx].items}
                itemStates={checklistItemState[currentChecklistIdx].itemStates}
                setItemState={setItemState}
                isChecklistComplete={checklistState[currentChecklistIdx]}
                setChecklistComplete={setChecklistComplete}
                resetChecklist={resetChecklist}
            />
        </>
    );
};
