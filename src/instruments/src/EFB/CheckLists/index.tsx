import React, { useState, useRef } from 'react';
import { IconCheck } from '@tabler/icons';
import { checklists, ECheckListTypes } from './data';
import { Navbar } from '../Components/Navbar';
import { useSessionStorage } from '../../Common/hooks';
import ChecklistNote from './ChecklistNote';
import ChecklistStep from './ChecklistStep';
import ChecklistTheLine from './ChecklistTheLine';
import './styles.scss';

enum EChecklistStates {
    INCOMPLETE = 'incomplete',
    CHECKS_DONE = 'checks-done',
    CHECKLIST_DONE = 'checklist-done'
}

export const Checklists: React.FC = () => {
    const position = useRef({ top: 0, y: 0 });
    const ref = useRef<HTMLDivElement>(null);

    const initialiseChecks = (() => {
        const checks = {};
        for (let i = 0; i < checklists.length; i++) {
            checks[i] = { isCompleted: false };
        }
        return checks;
    })();

    const [currentChecklist, setCurrentChecklist] = useState(0);
    const [checks, setChecks] = useSessionStorage('checks', initialiseChecks);

    const stepCount = checklists[currentChecklist].items.filter(({ type }) => type === ECheckListTypes.STEP).length;
    const checkCount = Object.keys(checks[currentChecklist]).filter((key) => key !== 'isCompleted' && checks[currentChecklist][key] !== false).length;

    const checklistState = (() => {
        if (checks[currentChecklist].isCompleted === true) return EChecklistStates.CHECKLIST_DONE;
        if (stepCount === checkCount) return EChecklistStates.CHECKS_DONE;
        return EChecklistStates.INCOMPLETE;
    })();

    console.log(`checklistState ${checklistState}`);

    // marks entire checklist
    const switchChecklistState = () => {
        // capture initial state of checklist completion
        const initialState = checks[currentChecklist].isCompleted;
        // clone checks
        const newMarks = { ...checks };
        // switch value of current checklist
        newMarks[currentChecklist].isCompleted = !checks[currentChecklist].isCompleted;
        // set new checks to state
        setChecks(newMarks);
        // if isCompleted, then change checklist to the next one
        if (!initialState && currentChecklist !== checklists.length - 1) setCurrentChecklist(currentChecklist + 1);
    };

    // marks single step
    const switchStepState = (stepIndex) => {
        // clone checks
        const newMarks = { ...checks };
        // switch value of check
        newMarks[currentChecklist][stepIndex] = !newMarks[currentChecklist][stepIndex];
        // set new checks to state
        setChecks(newMarks);
    };

    // console.log(`s: ${stepCount}, c: ${checkCount}, done: ${checklistState === EChecklistStates.CHECKS_DONE}`);

    const mouseDownHandler = (event) => {
        position.current.top = ref.current ? ref.current.scrollTop : 0;
        position.current.y = event.clientY;

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (event) => {
        const dy = event.clientY - position.current.y;
        if (ref.current) {
            ref.current.scrollTop = position.current.top - dy;
        }
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <h1 className="text-3xl pt-6 text-white">
                Checklists
            </h1>
            <Navbar tabs={checklists.map(({ name }) => name)} onSelected={(index) => setCurrentChecklist(index)} selectedIndex={currentChecklist} />
            <div
                ref={ref}
                onMouseDown={mouseDownHandler}
                className="flex-auto checklist-container mt-6 text-white overflow-hidden bg-navy-lighter rounded-2xl shadow-lg p-6 text-lg font-mono font-thin w-1/2 grabbable show-scrollbar overflow-y-auto"
            >
                {
                    checklists[currentChecklist].items.map((item, index) => {
                        switch (item.type) {
                        case 'step':
                            return (
                                <ChecklistStep
                                    {...item}
                                    key={item}
                                    isChecked={checks[currentChecklist][index]}
                                    // if current checklist isCompleted, then don't allow changing step states
                                    onChecked={() => !checks[currentChecklist].isCompleted && switchStepState(index)}
                                />
                            );

                        case 'note':
                            return (<ChecklistNote key={item} {...item} />);

                        case 'the-line':
                            return (<ChecklistTheLine key={item} />);

                        default: return false;
                        }
                    })
                }
            </div>
            <div className="flex-none pt-6 w-1/2">
                <CompletionButton checklistState={checklistState} onClick={switchChecklistState} />
            </div>
        </div>
    );
};

type CompletionButtonProps = {
    checklistState: string
    onClick: () => void
}

const CompletionButton: React.FC<CompletionButtonProps> = ({ checklistState, onClick }) => {
    let buttonText = '';
    let disableButton = false;

    switch (checklistState) {
    case EChecklistStates.CHECKLIST_DONE: {
        buttonText = 'CHECKLIST COMPLETED';
        break;
    }
    case EChecklistStates.CHECKS_DONE: {
        buttonText = 'MARK CHECKLIST COMPLETED';
        break;
    }
    default: {
        buttonText = 'CHECKLIST NOT COMPLETED';
        disableButton = true;
        break;
    }
    }

    return (
        <button
            type="button"
            disabled={disableButton}
            onClick={onClick}
            className={`text-white bg-teal-light ${disableButton && 'opacity-50'} p-2 flex w-full items-center justify-center rounded-lg focus:outline-none`}
        >
            <IconCheck className="mr-2" size={23} stroke={1.5} strokeLinejoin="miter" />
            {buttonText}
        </button>
    );
};
