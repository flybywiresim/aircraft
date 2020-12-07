import React from 'react';

type SettingsProps = {};
type SettingsState = {
    darkMode: boolean,
}

class Settings extends React.Component<SettingsProps, SettingsState> {
    state: SettingsState = {
        darkMode: this.darkModeInit(),
    };

    darkModeInit() {
        const darkMode = window.localStorage.getItem("darkMode");
        if (darkMode === null) {
            // @ts-ignore
            return document.getElementById("root").classList.contains("darkMode");
        } else if (darkMode === "true") {
            this.handleDark(true);
            return true;
        } else {
            this.handleDark(false);
            return false;
        }
    }

    handleDark(darkMode: boolean) {
        const element = document.createElement("div");
        if (darkMode) {
            element.classList.add("darkMode");
        } else {
            element.classList.remove("darkMode");
        }
        this.setState({ darkMode: darkMode });
    }

    handleDarkToggle() {
        const darkMode = !this.state.darkMode;
        const element = document.createElement("div");
        element.classList.toggle("darkMode");
        this.setState({ darkMode: darkMode });
        window.localStorage.setItem("darkMode", String(darkMode));
    }

    render() {
        return (
            <div className="Settings">
                <div id="SettingsItem1" className="SettingsItem">
                    <p>Dark Mode</p>
                    <p className="Switch" onClick={() => this.handleDarkToggle()}>{this.state.darkMode ? "On" : "Off"}</p>
                </div>
            </div>
        );
    };
}

export default Settings;