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

class CDUIdentPage {
    static ShowPage(mcdu) {
        const date = mcdu.getNavDataDateRange();
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.IdentPage;
        mcdu.activeSystem = 'FMGC';
        mcdu.setTemplate([
            ["A320-251N"],
            ["\xa0ENG"],
            ["LEAP-1A26[color]green"],
            ["\xa0ACTIVE NAV DATA BASE"],
            ["\xa0" + (date.length === 13 ? date[3] + date[4] + date[0] + date[1] + date[2] + "-" + date[8] + date[9] + date[5] + date[6] + date[7] : date) + "[color]cyan", "FBW2014001[color]green"],
            ["\xa0SECOND NAV DATA BASE"],
            ["{small}{3DEC-30DEC{end}[color]inop"],
            ["", ""],
            ["", ""],
            ["CHG CODE", "[b-text]{big}{green}{end}"],
            ["{small}[  ]{end}[color]cyan", ""],
            ["IDLE/PERF", "SOFTWARE[color]white"],
            ["+0.0/+0.0[color]green", "STATUS/XLOAD>[color]inop"]
        ]);
    }
}
