class CDUSecFplnMain {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUSecFplnMain.ShowPage(fmc, mcdu);
        }, 'MAINT');

        mcdu.setTemplate([
            ["SEC INDEX"],
            [""],
            ["{COPY ACTIVE[color]inop", "INIT>[color]inop"],
            [""],
            ["<SEC F-PLN[color]inop", "PERF>[color]inop"],
            [""],
            ["{DELETE SEC[color]inop"],
            [""],
            ["*ACTIVATE SEC[color]inop"],
            [""],
            [""],
            [""],
            ["*SWAP ACTIVE[color]inop"]
        ]);
    }
}
