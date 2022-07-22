use plotlib::page::Page;
use plotlib::repr::Plot;
use plotlib::style::LineStyle;
use plotlib::view::ContinuousView;
use std::time::Duration;
use systems::hydraulic::pumps::PumpCharacteristics;

use systems::hydraulic::*;

use systems::{
    electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
    shared::{
        update_iterator::FixedStepLoop, ElectricalBusType, HydraulicColor, PotentialOrigin,
        ReservoirAirPressure,
    },
    simulation::{
        test::{SimulationTestBed, TestBed},
        Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
    },
};
use uom::si::{
    angular_velocity::revolution_per_minute,
    electric_current::ampere,
    electric_potential::volt,
    f64::*,
    pressure::psi,
    volume::{cubic_inch, gallon},
};

use a320_systems::hydraulic::A320HydraulicCircuitFactory;

use rustplotlib::Figure;

struct TestHydraulicCircuitController {
    should_open_fire_shutoff_valve: Vec<bool>,
}
impl TestHydraulicCircuitController {
    fn commanding_open_fire_shutoff_valve(number_of_pumps: usize) -> Self {
        Self {
            should_open_fire_shutoff_valve: vec![true; number_of_pumps],
        }
    }
}
impl HydraulicCircuitController for TestHydraulicCircuitController {
    fn should_open_fire_shutoff_valve(&self, pump_index: usize) -> bool {
        // Pump index is one based, so we do - 1
        self.should_open_fire_shutoff_valve[pump_index - 1]
    }

    fn should_open_leak_measurement_valve(&self) -> bool {
        true
    }
}

struct TestPumpController {
    should_pressurise: bool,
}
impl TestPumpController {
    fn commanding_pressurise() -> Self {
        Self {
            should_pressurise: true,
        }
    }

    fn _commanding_depressurise() -> Self {
        Self {
            should_pressurise: false,
        }
    }

    fn _command_pressurise(&mut self) {
        self.should_pressurise = true;
    }

    fn command_depressurise(&mut self) {
        self.should_pressurise = false;
    }
}
impl PumpController for TestPumpController {
    fn should_pressurise(&self) -> bool {
        self.should_pressurise
    }
}

struct TestPowerTransferUnitController {
    should_enable: bool,
}
impl TestPowerTransferUnitController {
    fn _commanding_disabled() -> Self {
        Self {
            should_enable: false,
        }
    }

    fn _commanding_enabled() -> Self {
        Self {
            should_enable: true,
        }
    }

    fn _command_enable(&mut self) {
        self.should_enable = true;
    }
}
impl PowerTransferUnitController for TestPowerTransferUnitController {
    fn should_enable(&self) -> bool {
        self.should_enable
    }
}

fn main() {
    println!("Launching hyd simulation...");
    let path = "./src/systems/a320_hydraulic_simulation_graphs/";

    blue_circuit_epump(path);
}

fn make_figure(h: &History) -> Figure {
    use rustplotlib::{Axes2D, Line2D};

    let mut all_axis: Vec<Option<Axes2D>> = Vec::new();

    for (idx, cur_data) in h.data_vector.iter().enumerate() {
        let mut curr_axis = Axes2D::new()
            .add(
                Line2D::new(h.name_vector[idx].as_str())
                    .data(&h.time_vector, cur_data)
                    .color("blue")
                    // .marker("x")
                    // .linestyle("--")
                    .linewidth(1.0),
            )
            .xlabel("Time [sec]")
            .ylabel(h.name_vector[idx].as_str())
            .legend("best")
            .xlim(0.0, *h.time_vector.last().unwrap());
        // .ylim(-2.0, 2.0);

        curr_axis = curr_axis.grid(true);
        all_axis.push(Some(curr_axis));
    }

    Figure::new().subplots(all_axis.len() as u32, 1, all_axis)
}

/// History class to record a simulation
struct History {
    /// Simulation time starting from 0
    time_vector: Vec<f64>,
    /// Name of each var saved
    name_vector: Vec<String>,
    /// Vector data for each var saved
    data_vector: Vec<Vec<f64>>,
    _data_size: usize,
}
impl History {
    fn new(names: Vec<String>) -> History {
        History {
            time_vector: Vec::new(),
            name_vector: names.clone(),
            data_vector: Vec::new(),
            _data_size: names.len(),
        }
    }

    /// Sets initialisation values of each data before first step
    fn init(&mut self, start_time: f64, values: Vec<f64>) {
        self.time_vector.push(start_time);
        for v in values {
            self.data_vector.push(vec![v]);
        }
    }

    /// Updates all values and time vector
    fn update(&mut self, delta_time: f64, values: Vec<f64>) {
        self.time_vector
            .push(self.time_vector.last().unwrap() + delta_time);
        self.push_data(values);
    }

    fn push_data(&mut self, values: Vec<f64>) {
        for (idx, v) in values.iter().enumerate() {
            self.data_vector[idx].push(*v);
        }
    }

    /// Builds a graph using rust crate plotlib
    fn _show(self) {
        let mut v = ContinuousView::new()
            .x_range(0.0, *self.time_vector.last().unwrap())
            .y_range(0.0, 3500.0)
            .x_label("Time (s)")
            .y_label("Value");

        for cur_data in self.data_vector {
            // Here build the 2 by Xsamples vector
            let mut new_vector: Vec<(f64, f64)> = Vec::new();
            for (idx, sample) in self.time_vector.iter().enumerate() {
                new_vector.push((*sample, cur_data[idx]));
            }

            // We create our scatter plot from the data
            let s1: Plot = Plot::new(new_vector).line_style(LineStyle::new().colour("#DD3355"));

            v = v.add(s1);
        }

        // A page with a single view is then saved to an SVG file
        Page::single(&v).save("scatter.svg").unwrap();
    }

    /// Builds a graph using matplotlib python backend. PYTHON REQUIRED AS WELL AS MATPLOTLIB PACKAGE
    fn show_matplotlib(&self, figure_title: &str, path: &str) {
        let fig = make_figure(self);

        use rustplotlib::backend::Matplotlib;
        use rustplotlib::Backend;
        let mut mpl = Matplotlib::new().unwrap();
        mpl.set_style("ggplot").unwrap();

        fig.apply(&mut mpl).unwrap();

        let mut final_filename: String = path.to_owned();
        final_filename.push_str(figure_title);

        let _result = mpl.savefig(&final_filename);

        mpl.wait().unwrap();
    }
}

fn blue_circuit_epump(path: &str) {
    let epump_names = vec!["Pump rpm".to_string(), "Pump displacement".to_string()];

    let hyd_circuit_names = vec![
        "Pump section Pressure".to_string(),
        "System section Pressure".to_string(),
        "Sections delta Pressure".to_string(),
        "Pump section switch".to_string(),
        "System section switch".to_string(),
        "Accumulator fluid vol".to_string(),
    ];

    let reservoir_names = vec![
        "Reservoir volume".to_string(),
        "Pump section Pressure".to_string(),
        "System section Pressure".to_string(),
    ];

    let mut hyd_circuit_history = History::new(hyd_circuit_names);
    let mut reservoir_history = History::new(reservoir_names);
    let mut pump_history = History::new(epump_names);

    let mut test_bed = SimulationTestBed::new(|context| {
        let hyd_loop = hydraulic_loop(context, HydraulicColor::Blue);
        let pump = electric_pump(context);
        A320SimpleMainElecHydraulicsTestAircraft::new(context, hyd_loop, pump)
    });

    hyd_circuit_history.init(
        0.0,
        vec![
            test_bed
                .query(|a| a.hydraulic_circuit.pump_pressure(0))
                .get::<psi>(),
            test_bed.query(|a| a.hydraulic_circuit.system_section_pressure().get::<psi>()),
            test_bed.query(|a| a.hydraulic_circuit.system_section_pressure().get::<psi>())
                - test_bed
                    .query(|a| a.hydraulic_circuit.pump_pressure(0))
                    .get::<psi>(),
            test_bed.query(|a| a.hydraulic_circuit.pump_section_pressure_switch(0) as u8 as f64),
            test_bed.query(|a| a.hydraulic_circuit.system_section_pressure_switch() as u8 as f64),
            test_bed.query(|a| {
                a.hydraulic_circuit
                    .system_accumulator_fluid_volume()
                    .get::<gallon>()
            }),
        ],
    );

    reservoir_history.init(
        0.0,
        vec![
            test_bed.query(|a| a.hydraulic_circuit.reservoir_level().get::<gallon>()),
            test_bed.query(|a| a.hydraulic_circuit.pump_pressure(0).get::<psi>()),
            test_bed.query(|a| a.hydraulic_circuit.system_section_pressure().get::<psi>()),
        ],
    );
    pump_history.init(
        0.0,
        vec![
            test_bed.query(|a| a.elec_pump.speed().get::<revolution_per_minute>()),
            test_bed.query(|a| a.elec_pump.displacement().get::<cubic_inch>()),
        ],
    );

    let step_duration = Duration::from_millis(33);

    for step_idx in 0..1000 {
        if step_idx > 500 {
            test_bed.command(|a| a.epump_controller.command_depressurise());
        }
        test_bed.run_with_delta(step_duration);

        hyd_circuit_history.update(
            step_duration.as_secs_f64(),
            vec![
                test_bed.query(|a| a.hydraulic_circuit.pump_pressure(0).get::<psi>()),
                test_bed.query(|a| a.hydraulic_circuit.system_section_pressure().get::<psi>()),
                test_bed.query(|a| a.hydraulic_circuit.system_section_pressure().get::<psi>())
                    - test_bed
                        .query(|a| a.hydraulic_circuit.pump_pressure(0))
                        .get::<psi>(),
                test_bed
                    .query(|a| a.hydraulic_circuit.pump_section_pressure_switch(0) as u8 as f64),
                test_bed
                    .query(|a| a.hydraulic_circuit.system_section_pressure_switch() as u8 as f64),
                test_bed
                    .query(|a| a.hydraulic_circuit.system_accumulator_fluid_volume())
                    .get::<gallon>(),
            ],
        );
        reservoir_history.update(
            step_duration.as_secs_f64(),
            vec![
                test_bed.query(|a| a.hydraulic_circuit.reservoir_level().get::<gallon>()),
                test_bed.query(|a| a.hydraulic_circuit.pump_pressure(0).get::<psi>()),
                test_bed.query(|a| a.hydraulic_circuit.system_section_pressure().get::<psi>()),
            ],
        );

        pump_history.update(
            step_duration.as_secs_f64(),
            vec![
                test_bed.query(|a| a.elec_pump.speed().get::<revolution_per_minute>()),
                test_bed.query(|a| a.elec_pump.displacement().get::<cubic_inch>()),
            ],
        );
    }

    hyd_circuit_history.show_matplotlib("hyd_circuit_blue_tests", path);
    reservoir_history.show_matplotlib("hyd_circuit_blue_reservoir_tests", path);
    pump_history.show_matplotlib("hyd_circuit_blue_pump_tests", path);
}

fn hydraulic_loop(context: &mut InitContext, loop_color: HydraulicColor) -> HydraulicCircuit {
    match loop_color {
        HydraulicColor::Yellow => A320HydraulicCircuitFactory::new_yellow_circuit(context),
        HydraulicColor::Blue => A320HydraulicCircuitFactory::new_blue_circuit(context),
        HydraulicColor::Green => A320HydraulicCircuitFactory::new_green_circuit(context),
    }
}

fn electric_pump(context: &mut InitContext) -> ElectricPump {
    ElectricPump::new(
        context,
        "DEFAULT",
        ElectricalBusType::AlternatingCurrentGndFltService,
        ElectricCurrent::new::<ampere>(45.),
        PumpCharacteristics::a320_electric_pump(),
    )
}

fn _engine_driven_pump(context: &mut InitContext) -> EngineDrivenPump {
    EngineDrivenPump::new(context, "DEFAULT", PumpCharacteristics::a320_edp())
}

struct A320TestPneumatics {
    pressure: Pressure,
}
impl A320TestPneumatics {
    pub fn new() -> Self {
        Self {
            pressure: Pressure::new::<psi>(50.),
        }
    }

    fn _set_nominal_air_pressure(&mut self) {
        self.pressure = Pressure::new::<psi>(50.);
    }

    fn _set_low_air_pressure(&mut self) {
        self.pressure = Pressure::new::<psi>(1.);
    }

    fn pressure(&self) -> Pressure {
        self.pressure
    }
}
impl ReservoirAirPressure for A320TestPneumatics {
    fn green_reservoir_pressure(&self) -> Pressure {
        self.pressure
    }

    fn blue_reservoir_pressure(&self) -> Pressure {
        self.pressure
    }

    fn yellow_reservoir_pressure(&self) -> Pressure {
        self.pressure
    }
}

struct A320SimpleMainElecHydraulicsTestAircraft {
    updater: FixedStepLoop,

    pneumatics: A320TestPneumatics,

    hydraulic_circuit: HydraulicCircuit,
    circuit_controller: TestHydraulicCircuitController,

    elec_pump: ElectricPump,
    epump_controller: TestPumpController,

    powered_source_ac: TestElectricitySource,
    ac_ground_service_bus: ElectricalBus,
    dc_ground_service_bus: ElectricalBus,
    ac_1_bus: ElectricalBus,
    ac_2_bus: ElectricalBus,
    dc_1_bus: ElectricalBus,
    dc_2_bus: ElectricalBus,
    dc_ess_bus: ElectricalBus,
    dc_hot_1_bus: ElectricalBus,
    dc_hot_2_bus: ElectricalBus,
}
impl A320SimpleMainElecHydraulicsTestAircraft {
    fn new(
        context: &mut InitContext,
        hydraulic_circuit: HydraulicCircuit,
        elec_pump: ElectricPump,
    ) -> Self {
        Self {
            updater: FixedStepLoop::new(Duration::from_millis(33)),
            pneumatics: A320TestPneumatics::new(),
            hydraulic_circuit,
            circuit_controller: TestHydraulicCircuitController::commanding_open_fire_shutoff_valve(
                1,
            ),
            elec_pump,
            epump_controller: TestPumpController::commanding_pressurise(),
            powered_source_ac: TestElectricitySource::powered(
                context,
                PotentialOrigin::EngineGenerator(1),
            ),
            ac_ground_service_bus: ElectricalBus::new(
                context,
                ElectricalBusType::AlternatingCurrentGndFltService,
            ),
            dc_ground_service_bus: ElectricalBus::new(
                context,
                ElectricalBusType::DirectCurrentGndFltService,
            ),
            ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
            ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),
            dc_1_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
            dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
            dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
            dc_hot_1_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentHot(1)),
            dc_hot_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentHot(2)),
        }
    }
}

impl Aircraft for A320SimpleMainElecHydraulicsTestAircraft {
    fn update_before_power_distribution(
        &mut self,
        _: &UpdateContext,
        electricity: &mut Electricity,
    ) {
        self.powered_source_ac
            .power_with_potential(ElectricPotential::new::<volt>(115.));
        electricity.supplied_by(&self.powered_source_ac);

        electricity.flow(&self.powered_source_ac, &self.ac_1_bus);
        electricity.flow(&self.powered_source_ac, &self.ac_2_bus);
        electricity.flow(&self.powered_source_ac, &self.ac_ground_service_bus);
        electricity.flow(&self.powered_source_ac, &self.dc_ground_service_bus);
        electricity.flow(&self.powered_source_ac, &self.dc_1_bus);
        electricity.flow(&self.powered_source_ac, &self.dc_2_bus);
        electricity.flow(&self.powered_source_ac, &self.dc_ess_bus);
        electricity.flow(&self.powered_source_ac, &self.dc_hot_1_bus);
        electricity.flow(&self.powered_source_ac, &self.dc_hot_2_bus);
    }

    fn update_after_power_distribution(&mut self, context: &UpdateContext) {
        self.updater.update(context);

        for cur_time_step in self.updater {
            self.elec_pump.update(
                context,
                self.hydraulic_circuit.pump_section(0),
                self.hydraulic_circuit.reservoir(),
                &self.epump_controller,
            );

            self.hydraulic_circuit.update(
                &context.with_delta(cur_time_step),
                &mut vec![&mut self.elec_pump],
                None::<&mut ElectricPump>,
                None,
                &self.circuit_controller,
                self.pneumatics.pressure(),
            );
        }
    }
}
impl SimulationElement for A320SimpleMainElecHydraulicsTestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.hydraulic_circuit.accept(visitor);
        self.elec_pump.accept(visitor);

        visitor.visit(self);
    }
}
