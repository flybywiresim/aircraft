const msgSep = "---------------------------[color]white";
const srcMap = {
    "FAA": "faa",
    "IVAO": "ivao",
    "MSFS": "ms",
    "NOAA": "aviationweather",
    "PILOTEDGE": "pilotedge",
    "VATSIM": "vatsim"
};

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
    const storedMetarSrc = NXDataStore.get("CONFIG_METAR_SRC", "MSFS");
    for (const icao of icaos) {
        if (icao !== "") {
            await NXApi.getMetar(icao, srcMap[storedMetarSrc])
                .then((data) => {
                    lines.push(`METAR ${icao}[color]cyan`);
                    const newLines = wordWrapToStringList(data.metar, 25);
                    newLines.forEach(l => lines.push(l.concat("[color]green")));
                    lines.push(msgSep);
                })
                .catch(() => {
                    lines.push(`METAR ${icao}[color]cyan`);
                    lines.push('STATION NOT AVAILABLE[color]amber');
                    lines.push(msgSep);
                });
        }
    }
    store["sendStatus"] = "SENT";
    updateView();
};

const getTAF = async (icaos, lines, store, updateView) => {
    const storedTafSrc = NXDataStore.get("CONFIG_TAF_SRC", "NOAA");
    for (const icao of icaos) {
        if (icao !== "") {
            await NXApi.getTaf(icao, srcMap[storedTafSrc])
                .then((data) => {
                    lines.push(`TAF ${icao}[color]cyan`);
                    const newLines = wordWrapToStringList(data.taf, 25);
                    newLines.forEach(l => lines.push(l.concat("[color]green")));
                    lines.push(msgSep);
                })
                .catch(() => {
                    lines.push(`TAF ${icao}[color]cyan`);
                    lines.push('STATION NOT AVAILABLE[color]amber');
                    lines.push(msgSep);
                });
        }
    }
    store["sendStatus"] = "SENT";
    updateView();
};

const getATIS = async (icao, lines, type, store, updateView) => {
    const storedAtisSrc = NXDataStore.get("CONFIG_ATIS_SRC", "FAA");
    if (icao !== "") {
        await NXApi.getAtis(icao, srcMap[storedAtisSrc])
            .then((data) => {
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
                lines.push(`ATIS ${icao}[color]cyan`);
                const newLines = wordWrapToStringList(atisData, 25);
                newLines.forEach(l => lines.push(l.concat("[color]green")));
                lines.push(msgSep);
            })
            .catch(() => {
                lines.push(`ATIS ${icao}[color]cyan`);
                lines.push('D-ATIS NOT AVAILABLE[color]amber');
                lines.push(msgSep);
            });
    }
    store["sendStatus"] = "SENT";
    updateView();
};

/**
 * Fetch SimBrief OFP data and store on FMCMainDisplay object
 * @param {FMCMainDisplay} mcdu FMCMainDisplay
 * @param {() => void} updateView
 */
const getSimBriefOfp = (mcdu, updateView) => {
    const simBriefUsername = NXDataStore.get("CONFIG_SIMBRIEF_USERNAME", "");

    if (!simBriefUsername) {
        mcdu.showErrorMessage("NO SIMBRIEF USER");
        throw ("No simbrief username provided");
    }

    mcdu.simbrief["sendStatus"] = "REQUESTING";
    updateView();

    return SimBriefApi.getSimBriefOfp(simBriefUsername)
        .then(data => {
            mcdu.simbrief["route"] = data.general.route;
            mcdu.simbrief["cruiseAltitude"] = data.general.initial_altitude;
            mcdu.simbrief["originIcao"] = data.origin.icao_code;
            mcdu.simbrief["destinationIcao"] = data.destination.icao_code;
            mcdu.simbrief["blockFuel"] = data.fuel.plan_ramp;
            mcdu.simbrief["payload"] = data.weights.payload;
            mcdu.simbrief["estZfw"] = data.weights.est_zfw;
            mcdu.simbrief["costIndex"] = data.general.costindex;
            mcdu.simbrief["navlog"] = data.navlog.fix;
            mcdu.simbrief["icao_airline"] = typeof data.general.icao_airline === 'string' ? data.general.icao_airline : "";
            mcdu.simbrief["flight_number"] = data.general.flight_number;
            mcdu.simbrief["alternateIcao"] = data.alternate.icao_code;
            mcdu.simbrief["avgTropopause"] = data.general.avg_tropopause;
            mcdu.simbrief["ete"] = data.times.est_time_enroute;
            mcdu.simbrief["blockTime"] = data.times.est_block;
            mcdu.simbrief["outTime"] = data.times.est_out;
            mcdu.simbrief["onTime"] = data.times.est_on;
            mcdu.simbrief["inTime"] = data.times.est_in;
            mcdu.simbrief["offTime"] = data.times.est_off;
            mcdu.simbrief["taxiFuel"] = data.fuel.taxi;
            mcdu.simbrief["tripFuel"] = data.fuel.enroute_burn;
            mcdu.simbrief["sendStatus"] = "DONE";

            updateView();

            return mcdu.simbrief;
        })
        .catch(_err => {
            console.log(_err.message);

            mcdu.simbrief["sendStatus"] = "ERROR";
            updateView();
        });
};
