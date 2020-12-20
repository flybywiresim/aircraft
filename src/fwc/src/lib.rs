/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
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

use msfs::MSFSEvent;
use msfs::legacy::{NamedVariable, execute_calculator_code};

#[msfs::gauge(name=fwc)]
async fn demo(mut gauge: msfs::Gauge) -> Result<(), Box<dyn std::error::Error>> {
    let mut fwc = Fwc {
        inputs: FwcInputs {
            flight_phase: 7f64
        },
        outputs: FwcOutput {
            ecam_message: "Hello".to_string()
        }
    };

    while let Some(event) = gauge.next_event().await {
        match event {
            MSFSEvent::PostUpdate => {
                fwc.update();

                let ecam_message = NamedVariable::from("A32NX_FWC_OUT_MESSAGE");
                ecam_message.set_value(fwc.inputs.flight_phase);

                execute_calculator_code::<()>("(>H:A32NX_DCDU_FWC)");
            }
            _ => {}
        }
    }

    Ok(())
}


struct FwcInputs {
    flight_phase: f64
}

struct FwcOutput {
    ecam_message: String
}

struct Fwc {
    inputs: FwcInputs,
    outputs: FwcOutput
}

impl Fwc {
    fn update(&mut self) {
        self.acquire();
        self.concentrate();
        self.output();
    }

    fn acquire(&self) {

    }

    fn concentrate(&self) {

    }

    fn output(&mut self) {
        self.outputs.ecam_message = self.inputs.flight_phase.to_string();
    }
}