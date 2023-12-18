import React from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';
import { VhfPage } from './Pages/VhfPage';
import { MessageArea } from './Components/MessageArea';
import { HfPage } from './Pages/HfPage';
import { useInteractionEvent } from '../Common/hooks';
import { SqwkPage } from './Pages/SqwkPage';
import { TelPage } from './Pages/TelPage';
import { MenuPage } from './Pages/Menu/MenuPage';
import { NavPage } from './Pages/NavPage';

export const RadioManagementPanel = (props) => {
    const history = useHistory();

    useInteractionEvent(`A380X_RMP${props.side}_VHF_PRESSED`, () => history.push('/vhf'));
    useInteractionEvent(`A380X_RMP${props.side}_HF_PRESSED`, () => history.push('/hf'));
    useInteractionEvent(`A380X_RMP${props.side}_TEL_PRESSED`, () => history.push('/tel'));
    useInteractionEvent(`A380X_RMP${props.side}_SQWK_PRESSED`, () => history.push('/sqwk'));
    useInteractionEvent(`A380X_RMP${props.side}_MENU_PRESSED`, () => history.push('/menu'));
    useInteractionEvent(`A380X_RMP${props.side}_NAV_PRESSED`, () => history.push('/nav'));

    return (
        <svg viewBox="0 0 1664 1024">
            <g>
                <Switch>
                    <Redirect exact from="/" to="/vhf" />
                    <Route path="/vhf">
                        <VhfPage side={props.side} />
                        <MessageArea showSquawk />
                    </Route>
                    <Route path="/hf">
                        <HfPage />
                        <MessageArea showSquawk />
                    </Route>
                    <Route path="/tel">
                        <TelPage />
                        <MessageArea showSquawk />
                    </Route>
                    <Route path="/sqwk">
                        <SqwkPage />
                        <MessageArea showSquawk={false} />
                    </Route>
                    <Route path="/menu">
                        <MenuPage />
                        <MessageArea showSquawk={false} />
                    </Route>
                    <Route path="/nav">
                        <NavPage />
                        <MessageArea showSquawk={false} />
                    </Route>
                </Switch>
            </g>
        </svg>
    );
};
