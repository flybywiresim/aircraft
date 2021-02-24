/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';

type SettingsProps = {};
type SettingsState = {
    darkMode: boolean,
}

class Settings extends React.Component<SettingsProps, SettingsState> {
    constructor(props: SettingsProps) {
        super(props);
        this.state = { darkMode: this.darkModeInit() };
    }

    handleDark(darkMode: boolean) {
        const element = document.createElement('div');
        if (darkMode) {
            element.classList.add('darkMode');
        } else {
            element.classList.remove('darkMode');
        }
        this.setState({ darkMode });
    }

    handleDarkToggle() {
        const darkMode = !this.state.darkMode;
        const element = document.body;
        element.classList.toggle('darkMode');
        this.setState((state) => ({ darkMode: !state.darkMode }));
        window.localStorage.setItem('darkMode', String(darkMode));
    }

    darkModeInit() {
        const darkMode = window.localStorage.getItem('darkMode');
        if (darkMode === null) {
            // @ts-ignore
            return document.body.classList.contains('darkMode');
        } if (darkMode === 'true') {
            this.handleDark(true);
            return true;
        }
        this.handleDark(false);
        return false;
    }

    render() {
        return (
            <div className="w-full h-full">
                <p className="text-white font-medium mt-6 ml-4 text-3xl">Inop.</p>
            </div>
        );
    }
}

export default Settings;
