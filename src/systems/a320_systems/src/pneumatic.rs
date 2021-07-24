use systems::shared::{PneumaticValve, PneumaticValveSignal, ControllerSignal};
use crate::UpdateContext;
use systems::{
    overhead::OnOffFaultPushButton,
    simulation::{SimulationElement, SimulationElementVisitor},
	pneumatic::{PneumaticContainer, PneumaticPipe, DefaultValve},
	hydraulic::{Fluid}
};
use uom::si::{
    f64::*,
    pressure::{pascal, psi},
    volume::{cubic_meter},
	ratio::{percent}
};

pub struct A320Pneumatic {
	bmcs: [BleedMonitoringComputer; 2],
	engines: [EngineBleedSystem; 2],
}
impl A320Pneumatic {
	fn new() -> Self {
		Self {
			bmcs: [BleedMonitoringComputer::new(1), BleedMonitoringComputer::new(2)],
			engines: [EngineBleedSystem::new(1), EngineBleedSystem::new(2)],
		}
	}

	fn update(&mut self, context: &UpdateContext) {
		// Update BMC
		for bmc in self.bmcs.iter_mut() {
			bmc.update(context, &self.engines);
		}

		// Choose appropriate BMC
		// TODO: Use some logic handling failures
		let bmc = &self.bmcs[0];

		// Update engine systems
		for engine in self.engines.iter_mut() {
			engine.update(context, bmc);
		}

		// Update APU stuff
	}
}

struct IPValveController {
	// Engine number
	number:  usize,
	upstream_pressure: Pressure,
	downstream_pressure: Pressure,
}
impl ControllerSignal<PneumaticValveSignal> for IPValveController {
	fn signal(&self) -> Option<PneumaticValveSignal> {
		if self.upstream_pressure > self.downstream_pressure {
			Some(PneumaticValveSignal::close())
		} else {
			Some(PneumaticValveSignal::open())
		}
	}
}
impl IPValveController {
	fn new(number: usize) -> Self {
		Self {
			number,
			downstream_pressure: Pressure::new::<psi>(0.),
			upstream_pressure: Pressure::new::<psi>(0.),
		}
	}

	fn update(&mut self, context: &UpdateContext, bmc: &BleedMonitoringComputer) {
		self.upstream_pressure = bmc.ip_pressure();
	}
}

struct HPValveController {
	// Engine number
	number:  usize,
	upstream_pressure: Pressure
}
impl ControllerSignal<PneumaticValveSignal> for HPValveController {
	fn signal(&self) -> Option<PneumaticValveSignal> {
		if self.upstream_pressure < Pressure::new::<psi>(Self::OPENING_PRESSURE_PSI) {
			Some(PneumaticValveSignal::close())
		} else {
			Some(PneumaticValveSignal::open())
		}
	}
}
impl HPValveController {
	// https://discord.com/channels/738864299392630914/755137986508882021/867145227042029578
	const OPENING_PRESSURE_PSI: f64 = 18.;

	fn new(number: usize) -> Self {
		Self {
			number,
			upstream_pressure: Pressure::new::<psi>(0.),
		}
	}

	fn update(&mut self, context: &UpdateContext, bmc: &BleedMonitoringComputer) {
		self.upstream_pressure = bmc.hp_pressure();
	}
}

struct PRValveController {
	// Engine number
	number:  usize,
	transfer_pressure: Pressure,
	regulated_pressure: Pressure,
}
impl ControllerSignal<PneumaticValveSignal> for PRValveController {
	fn signal(&self) -> Option<PneumaticValveSignal> {
		// TODO: Use some more sophisticated regulation

		if self.transfer_pressure < Pressure::new::<psi>(Self::OPENING_PRESSURE_PSI) {
			Some(PneumaticValveSignal::close())
		} else if self.regulated_pressure > Pressure::new::<psi>(Self::TARGET_PRESSURE_PSI) {
			Some(PneumaticValveSignal::open())
		} else {
			Some(PneumaticValveSignal::close())
		}
	}
}
impl PRValveController {
	// https://discord.com/channels/738864299392630914/755137986508882021/867144858992771092
	const OPENING_PRESSURE_PSI: f64 = 15.;

	// https://discord.com/channels/738864299392630914/755137986508882021/867131639461183489
	const TARGET_PRESSURE_PSI: f64 = 46.;

	fn new(number: usize) -> Self {
		Self {
			number,
			transfer_pressure: Pressure::new::<psi>(0.),
			regulated_pressure: Pressure::new::<psi>(0.),
		}
	}

	fn update(&mut self, context: &UpdateContext, bmc: &BleedMonitoringComputer) {
		self.transfer_pressure = bmc.transfer_pressure(self.number);
		self.regulated_pressure = bmc.regulated_pressure(self.number);
	}
}

struct EngineBleedSystemData {
	// Engine number
	number: usize,
	// Pressure between IP/HP valves and the PRV
	transfer_pressure: Pressure,
	// Pressure after PRV
	regulated_pressure: Pressure
}
impl EngineBleedSystemData {
	fn new(number: usize) -> Self {
		Self {
			number,
			transfer_pressure: Pressure::new::<psi>(0.),
			regulated_pressure: Pressure::new::<psi>(0.),
		}
	}
}

struct BleedMonitoringComputer {
	number: usize,
	engine_bleed_system_datas: [EngineBleedSystemData; 2]
}
impl BleedMonitoringComputer {
	fn new(number: usize) -> Self {
		Self {
			number,
			engine_bleed_system_datas: [
				EngineBleedSystemData::new(1),
				EngineBleedSystemData::new(2),
			]
		}
	}

	fn hp_pressure(&self) -> Pressure {
		// TODO: use engine parameters
		Pressure::new::<psi>(40.)
	}

	fn ip_pressure(&self) -> Pressure {
		// TODO: use engine parameters
		Pressure::new::<psi>(20.)
	}

	fn transfer_pressure(&self, number: usize) -> Pressure {
		self.engine_bleed_system_datas[number].transfer_pressure
	}

	fn regulated_pressure(&self, number: usize) -> Pressure {
		self.engine_bleed_system_datas[number].regulated_pressure
	}

	fn update(&mut self, context: &UpdateContext, engines: &[EngineBleedSystem; 2]) {
		for engine in engines.iter() {
			self.update_engine_data(engine);
		}
	}

	fn update_engine_data(&mut self, engine: &EngineBleedSystem) {
		self.engine_bleed_system_datas[engine.number].transfer_pressure = engine.transfer_pressure_pipe.pressure();
		self.engine_bleed_system_datas[engine.number].regulated_pressure = engine.regulated_pressure_pipe.pressure();
	}
}

struct EngineBleedSystem {
	number: usize,
	ip_valve: DefaultValve,
	hp_valve: DefaultValve,
	pr_valve: DefaultValve,
	hp_valve_controller: HPValveController,
	ip_valve_controller: IPValveController,
	pr_valve_controller: PRValveController,
	transfer_pressure_pipe: PneumaticPipe,
	regulated_pressure_pipe: PneumaticPipe,
}
impl EngineBleedSystem {
	fn new(number: usize) -> Self {
		Self {
			number,
			ip_valve: DefaultValve::new(),
			hp_valve: DefaultValve::new(),
			pr_valve: DefaultValve::new(),
			ip_valve_controller: IPValveController::new(number),
			hp_valve_controller: HPValveController::new(number),
			pr_valve_controller: PRValveController::new(number),
			transfer_pressure_pipe: PneumaticPipe::new(
				Volume::new::<cubic_meter>(1.), // TODO: Figure out volume to use
				Fluid::new(Pressure::new::<pascal>(142000.)), // https://en.wikipedia.org/wiki/Bulk_modulus#Selected_values
				Pressure::new::<psi>(0.),
			),
			regulated_pressure_pipe: PneumaticPipe::new(
				Volume::new::<cubic_meter>(1.), // TODO: Figure out volume to use
				Fluid::new(Pressure::new::<pascal>(142000.)), // https://en.wikipedia.org/wiki/Bulk_modulus#Selected_values
				Pressure::new::<psi>(0.),
			),
		}
	}

	fn update(&mut self, context: &UpdateContext, bmc: &BleedMonitoringComputer) {
		// Update controllers
		self.ip_valve_controller.update(context, bmc);
		self.hp_valve_controller.update(context, bmc);
		self.pr_valve_controller.update(context, bmc);

		// Update valves (open amount)
		self.ip_valve.update_open_amount(context, &self.ip_valve_controller);
		self.hp_valve.update_open_amount(context, &self.hp_valve_controller);
		self.pr_valve.update_open_amount(context, &self.pr_valve_controller);

		// Update valves (fluid movement)
		// TODO: Update all pipes once compression chamber logic is in
		self.pr_valve.update_move_fluid(&mut self.transfer_pressure_pipe, &mut self.regulated_pressure_pipe);
	}
}

pub struct A320PneumaticOverheadPanel {
    apu_bleed: OnOffFaultPushButton,
}
impl A320PneumaticOverheadPanel {
    pub fn new() -> Self {
        A320PneumaticOverheadPanel {
            apu_bleed: OnOffFaultPushButton::new_on("PNEU_APU_BLEED"),
        }
    }

    pub fn apu_bleed_is_on(&self) -> bool {
        self.apu_bleed.is_on()
    }
}
impl SimulationElement for A320PneumaticOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.apu_bleed.accept(visitor);

        visitor.visit(self);
    }
}
