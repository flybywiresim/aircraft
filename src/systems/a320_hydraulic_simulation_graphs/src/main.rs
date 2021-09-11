use plotlib::page::Page;
use plotlib::repr::Plot;
use plotlib::style::LineStyle;
use plotlib::view::ContinuousView;
use std::time::Duration;
use systems::electrical::test::TestElectricitySource;
use systems::electrical::ElectricalBus;
use systems::electrical::Electricity;

pub use systems::hydraulic::*;
use systems::shared::PotentialOrigin;
use systems::simulation::SimulationElement;
use systems::{shared::ElectricalBusType, simulation::UpdateContext};
use uom::si::{
    acceleration::foot_per_second_squared, f64::*, length::foot, pressure::psi,
    thermodynamic_temperature::degree_celsius, velocity::knot, volume::gallon,
};

extern crate rustplotlib;
use rustplotlib::Figure;

struct TestHydraulicLoopController {
    should_open_fire_shutoff_valve: Vec<bool>,
}
impl TestHydraulicLoopController {
    fn commanding_open_fire_shutoff_valve(number_of_pumps: usize) -> Self {
        Self {
            should_open_fire_shutoff_valve: vec![true; number_of_pumps],
        }
    }
}
impl HydraulicLoopController for TestHydraulicLoopController {
    fn should_open_fire_shutoff_valve(&self, pump_idx: usize) -> bool {
        self.should_open_fire_shutoff_valve[pump_idx]
    }
}

struct TestPumpController {
    should_pressurise: bool,
}
impl TestPumpController {
    fn _commanding_pressurise() -> Self {
        Self {
            should_pressurise: true,
        }
    }

    fn commanding_depressurise() -> Self {
        Self {
            should_pressurise: false,
        }
    }

    fn command_pressurise(&mut self) {
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

    hyd_circuit_basic(path);
}

fn make_figure(h: &History) -> Figure {
    use rustplotlib::{Axes2D, Line2D};

    let mut all_axis: Vec<Option<Axes2D>> = Vec::new();

    for (idx, cur_data) in h.data_vector.iter().enumerate() {
        let mut curr_axis = Axes2D::new()
            .add(
                Line2D::new(h.name_vector[idx].as_str())
                    .data(&h.time_vector, &cur_data)
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
        let fig = make_figure(&self);

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

fn hyd_circuit_basic(path: &str) {
    let hyd_circuit_names = vec![
        "Pump section Pressure".to_string(),
        "System section Pressure".to_string(),
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

    let mut edp = EngineDrivenPump::new("EDP");
    let mut edp_controller = TestPumpController::commanding_depressurise();

    let mut epump = electric_pump();
    let mut epump_controller = TestPumpController::commanding_depressurise();

    let mut hydraulic_loop = hydraulic_loop("YELLOW", 1);

    let context = context(Duration::from_millis(50));

    hyd_circuit_history.init(
        0.0,
        vec![
            hydraulic_loop.pump_pressure(0).get::<psi>(),
            hydraulic_loop.system_pressure().get::<psi>(),
            hydraulic_loop.pump_section_switch_pressurised(0) as u8 as f64,
            hydraulic_loop.system_section_switch_pressurised() as u8 as f64,
            hydraulic_loop
                .system_accumulator_fluid_volume()
                .get::<gallon>(),
        ],
    );

    reservoir_history.init(
        0.0,
        vec![
            hydraulic_loop.reservoir_level().get::<gallon>(),
            hydraulic_loop.pump_pressure(0).get::<psi>(),
            hydraulic_loop.system_pressure().get::<psi>(),
        ],
    );

    let mut edp_rpm = 0.;
    for x in 0..2000 {
        if x >= 200 {
            // After 10s pressurising edp
            edp_controller.command_pressurise();
            edp_rpm = 400.;
        }

        if x >= 1000 {
            // After 50s depressurising edp
            //edp_controller.command_depressurise();
            edp_rpm = 0.;
        }

        if x >= 1100 {
            // After 35s pressurising epump
            epump_controller.command_pressurise();
        }

        if x >= 1400 {
            // After 70s depressurising epump
            epump_controller.command_depressurise();
        }

        edp.update(
            &context,
            hydraulic_loop.pump_pressure(0),
            hydraulic_loop.reservoir(),
            edp_rpm,
            &edp_controller,
        );

        epump.receive_power(&test_electricity(
            ElectricalBusType::AlternatingCurrentEssential,
            true,
        ));
        epump.update(
            &context,
            hydraulic_loop.system_pressure(),
            hydraulic_loop.reservoir(),
            &epump_controller,
        );

        hydraulic_loop.update(
            &mut vec![Box::new(&mut edp)],
            &mut Some(&mut epump),
            &None,
            &context,
            &TestHydraulicLoopController::commanding_open_fire_shutoff_valve(1),
        );

        hyd_circuit_history.update(
            context.delta_as_secs_f64(),
            vec![
                hydraulic_loop.pump_pressure(0).get::<psi>(),
                hydraulic_loop.system_pressure().get::<psi>(),
                hydraulic_loop.pump_section_switch_pressurised(0) as u8 as f64,
                hydraulic_loop.system_section_switch_pressurised() as u8 as f64,
                hydraulic_loop
                    .system_accumulator_fluid_volume()
                    .get::<gallon>(),
            ],
        );
        reservoir_history.update(
            context.delta_as_secs_f64(),
            vec![
                hydraulic_loop.reservoir_level().get::<gallon>(),
                hydraulic_loop.pump_pressure(0).get::<psi>(),
                hydraulic_loop.system_pressure().get::<psi>(),
            ],
        );
    }

    hyd_circuit_history.show_matplotlib("hyd_circuit_tests", &path);
    reservoir_history.show_matplotlib("hyd_circuit_reservoir_tests", &path);
}

fn test_electricity(bus_id: ElectricalBusType, is_powered: bool) -> Electricity {
    let mut electricity = Electricity::new();
    let mut source =
        TestElectricitySource::unpowered(PotentialOrigin::EngineGenerator(1), &mut electricity);

    if is_powered {
        source.power();
    }

    let bus = ElectricalBus::new(bus_id, &mut electricity);

    electricity.supplied_by(&source);
    electricity.flow(&source, &bus);

    electricity
}

fn hydraulic_loop(loop_color: &str, main_pump_number: usize) -> HydraulicCircuit {
    match loop_color {
        "GREEN" => HydraulicCircuit::new(
            loop_color,
            main_pump_number,
            100.,
            Volume::new::<gallon>(10.),
            Volume::new::<gallon>(3.6),
            Pressure::new::<psi>(1450.),
            Pressure::new::<psi>(1750.),
            Pressure::new::<psi>(1450.),
            Pressure::new::<psi>(1750.),
            true,
            false,
        ),
        "YELLOW" => HydraulicCircuit::new(
            loop_color,
            main_pump_number,
            100.,
            Volume::new::<gallon>(10.),
            Volume::new::<gallon>(3.6),
            Pressure::new::<psi>(1450.),
            Pressure::new::<psi>(1750.),
            Pressure::new::<psi>(1450.),
            Pressure::new::<psi>(1750.),
            true,
            false,
        ),
        _ => HydraulicCircuit::new(
            loop_color,
            main_pump_number,
            100.,
            Volume::new::<gallon>(10.),
            Volume::new::<gallon>(3.6),
            Pressure::new::<psi>(1450.),
            Pressure::new::<psi>(1750.),
            Pressure::new::<psi>(1450.),
            Pressure::new::<psi>(1750.),
            true,
            false,
        ),
    }
}

fn electric_pump() -> ElectricPump {
    ElectricPump::new("DEFAULT", ElectricalBusType::AlternatingCurrentEssential)
}

fn _engine_driven_pump() -> EngineDrivenPump {
    EngineDrivenPump::new("DEFAULT")
}

fn context(delta_time: Duration) -> UpdateContext {
    UpdateContext::new(
        delta_time,
        Velocity::new::<knot>(250.),
        Length::new::<foot>(5000.),
        ThermodynamicTemperature::new::<degree_celsius>(25.0),
        true,
        Acceleration::new::<foot_per_second_squared>(0.),
    )
}
