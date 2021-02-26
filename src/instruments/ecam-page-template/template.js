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

'use strict';

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

/* global BaseInstrument */
/* global registerInstrument */

// eslint-disable-next-line camelcase
class A32NX_PAGE_NAME_Logic extends Airliners.EICASTemplateElement {
    get templateID() {
        return 'A32NX_PAGE_NAME_TEMPLATE';
    }

    connectedCallback() {
        super.connectedCallback();

        // This is big hack, see `template.html`.
        {
            const code = document.getElementById('A32NX_BUNDLED_STYLE').innerHTML;
            const style = document.createElement('style');
            style.innerHTML = code;
            document.head.appendChild(style);
        }
        {
            const code = document.getElementById('A32NX_BUNDLED_LOGIC').innerHTML;
            const script = document.createElement('script');
            script.innerHTML = code;
            document.body.appendChild(script);
        }
    }

    update(_deltaTime) {
        this.dispatchEvent(new CustomEvent('update', { detail: this.deltaTime }));
    }
}

registerInstrument('a32nx-PAGE_NAME_LOWER_SKEWER-element', A32NX_PAGE_NAME_Logic);
