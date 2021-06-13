import React, { useState, useContext, useRef } from 'react';
import { IconCheck } from '@tabler/icons';
import { checklistCollection, EChecklistTypes } from './data';
import { Navbar } from '../Components/Navbar';
import ChecklistStep from './ChecklistStep';
import ChecklistTheLine from './ChecklistTheLine';
import { EChecklistActions } from '../Store/checklists-reducer';
import { GlobalContext } from '../Store/global-context';

enum EChecklistStates {
    INCOMPLETE = 'incomplete',
    CHECKS_DONE = 'checks-done',
    CHECKLIST_DONE = 'checklist-done'
}

const Checklists: React.FC = () => {
    const position = useRef({ top: 0, y: 0 });
    const ref = useRef<HTMLDivElement>(null);

    const [currentChecklist, setCurrentChecklist] = useState(0);
    const { checklistState, checklistDispatch } = useContext(GlobalContext);

    const isChecklistComplete = (() => {
        if (checklistState[currentChecklist]) {
            if (checklistState[currentChecklist].isCompleted) return EChecklistStates.CHECKLIST_DONE;
            const stepCount = checklistCollection[currentChecklist].items.filter(({ type }) => type === EChecklistTypes.STEP).length;
            const checkCount = Object.keys(checklistState[currentChecklist]).filter((key) => key !== 'isCompleted' && checklistState[currentChecklist][key] !== false).length;
            if (checklistState[currentChecklist].isCompleted === true) return EChecklistStates.CHECKLIST_DONE;
            if (stepCount === checkCount) return EChecklistStates.CHECKS_DONE;
            return EChecklistStates.INCOMPLETE;
        }
        return EChecklistStates.INCOMPLETE;
    })();

    // marks entire checklist
    const switchChecklistState = () => {
        checklistDispatch({ type: EChecklistActions.SET_LIST_CHECK, payload: { checklistIndex: currentChecklist } });
        // if isCompleted, then change checklist to the next one
        if (currentChecklist !== checklistCollection.length - 1) setCurrentChecklist(currentChecklist + 1);
    };

    // marks single step
    const switchStepState = (stepIndex) => {
        checklistDispatch({ type: EChecklistActions.SET_STEP_CHECK, payload: { stepIndex, checklistIndex: currentChecklist } });
    };

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
            <Navbar tabs={checklistCollection.map(({ name }) => name)} onSelected={(index) => setCurrentChecklist(index)} selectedIndex={currentChecklist} />
            <div
                ref={ref}
                onMouseDown={mouseDownHandler}
                className="flex-auto checklist-container mt-6 text-white overflow-hidden
                bg-navy-lighter rounded-2xl shadow-lg p-6 text-lg font-mono font-thin
                w-1/2 grabbable show-scrollbar overflow-y-auto"
            >
                {
                    checklistCollection[currentChecklist].items.map((item, stepIndex) => {
                        const check = checklistState[currentChecklist];
                        const stepCheck = check && checklistState[currentChecklist][stepIndex];
                        const isChecked = stepCheck ? stepCheck.isCompleted : false;
                        switch (item.type) {
                        case 'step': {
                            return (
                                <ChecklistStep
                                    key={stepIndex.toString() + isChecked.toString()}
                                    {...item}
                                    isDisabled={checklistState[currentChecklist]?.isCompleted || false}
                                    isChecked={isChecked}
                                    // if current checklist isCompleted, then don't allow changing step states
                                    onChecked={() => switchStepState(stepIndex)}
                                />
                            );
                        }

                        case 'note':
                            return (<div key={item} {...item} />);

                        case 'the-line':
                            return (<ChecklistTheLine key={item} />);

                        default: return false;
                        }
                    })
                }
            </div>
            <div className="flex-none pt-6 w-1/2">
                <CompletionButton checklistState={isChecklistComplete} onClick={switchChecklistState} />
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

export default Checklists;
