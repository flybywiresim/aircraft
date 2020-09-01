class CDUAocRequests {
    static ShowPage(mcdu, icaos) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["AOC REQUESTS"],
            [""],
            ["<WEATHER REQ", "FLT PLAN*[color]blue"],
            [""],
            ["<W/B REQ"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        if (icaos) {
            const messages = [];
            const getData = async () => {
                for (const icao of icaos) {
                    if (icao) {
                        await fetch(`https://cors-anywhere.herokuapp.com/https://aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&hoursBeforeNow=3&mostRecent=true&stationString=${icao}`)
                            .then(response => response.text())
                            .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
                            .then(data => messages.push(data.childNodes[0].childNodes[13].childNodes[1].childNodes[1].innerHTML.match(/(.*?\s){2}/g)))
                    }
                }
            }

            getData().then(() => {
                setTimeout(() => {
                    mcdu.setTemplate([
                        ["AOC REQUESTS"],
                        [""],
                        ["<WEATHER REQ", "FLT PLAN*[color]blue"],
                        [""],
                        ["<W/B REQ"],
                        [""],
                        [""],
                        [""],
                        [""],
                        [""],
                        [""],
                        [""],
                        ["<RETURN", "MESSAGE*[color]blue"]
                    ]);

                    const setSpace = (spaces) => {
                        let space = [];
                        
                    	for (let counter = 0; counter <= spaces; counter++) {
                      	    space+= " ";
                        }

                        return space;
                    }

                    const lines = []
                    messages.forEach(message => {
                        // const totalMcduPages = Math.ceil((message.length - 1) / 3);
                        lines.push(`METAR ${message[0]}`);
                        let LineNumberBaseRatio = 1; // 3
                        const totalLines = Math.ceil(message.length - 1 / 3)
                        for (let LineCount = 0; LineCount <= totalLines; LineCount++) {
                            const count = 3 * LineNumberBaseRatio;
                            if (message[count - 2]) {
                            	lines.push(`${message[count - 2]}${message[count - 1] ? message[count - 1] : setSpace(12)}${message[count] ? message[count] : setSpace(4)}`)
                            }
                            
                            LineNumberBaseRatio += 1;
                        }
                        lines.push(setSpace(10))
                    });
    
                    mcdu.onRightInput[5] = () => {
                        CDUAocRequestsMessage.ShowPage(mcdu, lines)
                    }

                }, 500);
            })   
        }

        mcdu.onLeftInput[0] = () => {
            CDUAocRequestsWeather.ShowPage(mcdu);
        }

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        }
    }
}