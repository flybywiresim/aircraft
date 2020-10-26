function wordWrapToStringList(text, maxLength) {
    const result = [];
    let line = [];
    let length = 0;
    text.split(" ").forEach(function (word) {
        if ((length + word.length) >= maxLength) {
            result.push(line.join(" "));
            line = []; length = 0;
        }
        length += word.length + 1;
        line.push(word);
    });
    if (line.length > 0) {
        result.push(line.join(" "));
    }
    return result;
}

function fetchTimeValue() {
    let timeValue = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
    if (timeValue) {
        const seconds = Number.parseInt(timeValue);
        const displayTime = Utils.SecondsToDisplayTime(seconds, true, true, false);
        timeValue = displayTime.toString();
        return timeValue.substring(0, 5);
    }
    return null;
}

const getMETAR = async (icaos, lines, store, updateView) => {
    const storedMetarSrc = GetStoredData("A32NX_CONFIG_METAR_SRC");
    let endpoint = "https://api.flybywiresim.com/metar";
    switch (storedMetarSrc) {
        case "VATSIM":
            endpoint += "?source=vatsim&icao=";
            break;
        case "PILOTEDGE":
            endpoint += "?source=pilotedge&icao=";
            break;
        case "IVAO":
            endpoint += "?source=ivao&icao=";
            break;
        default:
            endpoint += "?source=ms&icao=";
    }
    for (const icao of icaos) {
        if (icao !== "") {
            await fetch(`${endpoint}${icao}`)
                .then((response) => response.text())
                .then((data) => {
                    const error = data.slice(0, 9) == "FBW_ERROR";
                    if (!error) {
                        lines.push(`METAR ${icao}[color]blue`);
                        const newLines = wordWrapToStringList(data, 25);
                        newLines.forEach(l => lines.push(l.concat("[color]green")));
                        lines.push('---------------------------[color]white');
                    } else {
                        lines.push(`METAR ${icao}[color]blue`);
                        lines.push('STATION NOT AVAILABLE[color]red');
                        lines.push('---------------------------[color]white');
                    }
                });
        }
    }
    store["sendStatus"] = "SENT";
    updateView();
};

const getTAF = async (icaos, lines, store, updateView) => {
    const storedTafSrc = GetStoredData("A32NX_CONFIG_TAF_SRC");
    let endpoint = "https://api.flybywiresim.com/taf";
    switch (storedTafSrc) {
        case "IVAO":
            endpoint += "?source=ivao&icao=";
            break;
        default:
            endpoint += "?source=aviationweather&icao=";
    }
    for (const icao of icaos) {
        if (icao !== "") {
            await fetch(`${endpoint}${icao}`)
                .then((response) => response.text())
                .then((data) => {
                    const error = data.slice(0, 9) == "FBW_ERROR";
                    if (!error) {
                        lines.push(`TAF ${icao}[color]blue`);
                        const newLines = wordWrapToStringList(data, 25);
                        newLines.forEach(l => lines.push(l.concat("[color]green")));
                        lines.push('---------------------------[color]white');
                    } else {
                        lines.push(`TAF ${icao}[color]blue`);
                        lines.push('STATION NOT AVAILABLE[color]red');
                        lines.push('---------------------------[color]white');
                    }
                });
        }
    }
    store["sendStatus"] = "SENT";
    updateView();
};

const getATIS = async (icao, lines, type, store, updateView) => {
    const storedAtisSrc = GetStoredData("A32NX_CONFIG_ATIS_SRC");
    let endpoint = "https://api.flybywiresim.com/atis";
    switch (storedAtisSrc) {
        case "VATSIM":
            endpoint += "?source=vatsim&icao=";
            break;
        case "PILOTEDGE":
            endpoint += "?source=pilotedge&icao=";
            break;
        case "IVAO":
            endpoint += "?source=ivao&icao=";
            break;
        default:
            endpoint += "?source=faa&icao=";
    }
    if (icao !== "") {
        await fetch(`${endpoint}${icao}`)
            .then((response) => response.json())
            .then((data) => {
                const error = "error" in data;
                if (!error) {
                    let atisData;
                    switch (type) {
                        case 0:
                            if ("arr" in data) {
                                atisData = data.arr;
                            } else {
                                atisData = data.combined;
                            }
                            break;
                        case 1:
                            if ("dep" in data) {
                                atisData = data.dep;
                            } else {
                                atisData = data.combined;
                            }
                            break;
                        default:
                            atisData = data.combined;
                    }
                    lines.push(`ATIS ${icao}[color]blue`);
                    const newLines = wordWrapToStringList(atisData, 25);
                    newLines.forEach(l => lines.push(l.concat("[color]green")));
                    lines.push('---------------------------[color]white');
                } else {
                    lines.push(`ATIS ${icao}[color]blue`);
                    lines.push('D-ATIS NOT AVAILABLE[color]red');
                    lines.push('---------------------------[color]white');
                }
            });
    }
    store["sendStatus"] = "SENT";
    updateView();
};