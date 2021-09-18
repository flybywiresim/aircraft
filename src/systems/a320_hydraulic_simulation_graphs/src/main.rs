use plotlib::page::Page;
use plotlib::repr::Plot;
use plotlib::style::LineStyle;
use plotlib::view::ContinuousView;
use std::time::Duration;
pub use systems::hydraulic::*;
use systems::{shared::ElectricalBusType, simulation::UpdateContext};
use uom::si::{
    acceleration::foot_per_second_squared,
    angle::radian,
    angular_velocity::revolution_per_minute,
    f64::*,
    length::foot,
    pressure::{pascal, psi},
    thermodynamic_temperature::degree_celsius,
    velocity::knot,
    volume::{gallon, liter},
    volume_rate::gallon_per_second,
};

extern crate rustplotlib;
use rustplotlib::Figure;

struct TestHydraulicLoopController {
    should_open_fire_shutoff_valve: bool,
}
impl TestHydraulicLoopController {
    fn commanding_open_fire_shutoff_valve() -> Self {
        Self {
            should_open_fire_shutoff_valve: true,
        }
    }
}
impl HydraulicLoopController for TestHydraulicLoopController {
    fn should_open_fire_shutoff_valve(&self) -> bool {
        self.should_open_fire_shutoff_valve
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
    fn commanding_disabled() -> Self {
        Self {
            should_enable: false,
        }
    }

    fn commanding_enabled() -> Self {
        Self {
            should_enable: true,
        }
    }

    fn command_enable(&mut self) {
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

    green_loop_edp_simulation(path);
    yellow_green_ptu_loop_simulation(path);
    yellow_epump_plus_edp2_with_ptu(path);
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

/// Runs engine driven pump, checks pressure OK, shut it down, check drop of pressure after 20s
fn green_loop_edp_simulation(path: &str) {
    let green_loop_var_names = vec![
        "Loop Pressure".to_string(),
        "Loop Volume".to_string(),
        "Loop Reservoir".to_string(),
        "Loop Flow".to_string(),
    ];
    let mut green_loop_history = History::new(green_loop_var_names);

    let edp1_var_names = vec!["Delta Vol Max".to_string(), "pump rpm".to_string()];
    let mut edp1_history = History::new(edp1_var_names);

    let mut edp1 = engine_driven_pump();
    let mut edp1_controller = TestPumpController::commanding_pressurise();

    let mut green_loop = hydraulic_loop("GREEN");
    let green_loop_controller = TestHydraulicLoopController::commanding_open_fire_shutoff_valve();

    let edp_rpm = 3000.;
    let context = context(Duration::from_millis(100));

    let green_acc_var_names = vec![
        "Loop Pressure".to_string(),
        "Acc gas press".to_string(),
        "Acc fluid vol".to_string(),
        "Acc gas vol".to_string(),
    ];
    let mut accu_green_history = History::new(green_acc_var_names);

    green_loop_history.init(
        0.0,
        vec![
            green_loop.pressure().get::<psi>(),
            green_loop.loop_fluid_volume().get::<gallon>(),
            green_loop.reservoir_volume().get::<gallon>(),
            green_loop.current_flow().get::<gallon_per_second>(),
        ],
    );
    edp1_history.init(0.0, vec![edp1.delta_vol_max().get::<liter>(), edp_rpm]);
    accu_green_history.init(
        0.0,
        vec![
            green_loop.pressure().get::<psi>(),
            green_loop.accumulator_gas_pressure().get::<psi>(),
            green_loop.accumulator_fluid_volume().get::<gallon>(),
            green_loop.accumulator_gas_volume().get::<gallon>(),
        ],
    );
    for x in 0..600 {
        if x == 50 {
            // After 5s
            assert!(green_loop.pressure() >= Pressure::new::<psi>(2850.0));
        }
        if x == 200 {
            assert!(green_loop.pressure() >= Pressure::new::<psi>(2850.0));
            edp1_controller.command_depressurise();
        }
        if x >= 500 {
            // Shutdown + 30s
            assert!(green_loop.pressure() <= Pressure::new::<psi>(250.0));
        }

        edp1.update(
            &context,
            &green_loop,
            AngularVelocity::new::<revolution_per_minute>(edp_rpm),
            &edp1_controller,
        );
        green_loop.update(
            &context,
            Vec::new(),
            vec![&edp1],
            Vec::new(),
            Vec::new(),
            &green_loop_controller,
        );
        if x % 20 == 0 {
            println!("Iteration {}", x);
            println!("-------------------------------------------");
            println!("---PSI: {}", green_loop.pressure().get::<psi>());
            println!(
                "--------Reservoir Volume (g): {}",
                green_loop.reservoir_volume().get::<gallon>()
            );
            println!(
                "--------Loop Volume (g): {}",
                green_loop.loop_fluid_volume().get::<gallon>()
            );
            println!(
                "--------Acc Fluid Volume (L): {}",
                green_loop.accumulator_fluid_volume().get::<liter>()
            );
            println!(
                "--------Acc Gas Volume (L): {}",
                green_loop.accumulator_gas_volume().get::<liter>()
            );
            println!(
                "--------Acc Gas Pressure (psi): {}",
                green_loop.accumulator_gas_pressure().get::<psi>()
            );
        }

        green_loop_history.update(
            context.delta_as_secs_f64(),
            vec![
                green_loop.pressure().get::<psi>(),
                green_loop.loop_fluid_volume().get::<gallon>(),
                green_loop.reservoir_volume().get::<gallon>(),
                green_loop.current_flow().get::<gallon_per_second>(),
            ],
        );
        edp1_history.update(
            context.delta_as_secs_f64(),
            vec![edp1.delta_vol_max().get::<liter>(), edp_rpm],
        );
        accu_green_history.update(
            context.delta_as_secs_f64(),
            vec![
                green_loop.pressure().get::<psi>(),
                green_loop.accumulator_gas_pressure().get::<psi>(),
                green_loop.accumulator_fluid_volume().get::<gallon>(),
                green_loop.accumulator_gas_volume().get::<gallon>(),
            ],
        );
    }

    green_loop_history.show_matplotlib("green_loop_edp_simulation_press", &path);
    edp1_history.show_matplotlib("green_loop_edp_simulation_EDP1 data", &path);
    accu_green_history.show_matplotlib("green_loop_edp_simulation_Green Accum data", &path);
}

fn yellow_green_ptu_loop_simulation(path: &str) {
    let loop_var_names = vec![
        "GREEN Loop Pressure".to_string(),
        "YELLOW Loop Pressure".to_string(),
        "GREEN Loop reservoir".to_string(),
        "YELLOW Loop reservoir".to_string(),
        "GREEN Loop delta vol".to_string(),
        "YELLOW Loop delta vol".to_string(),
    ];
    let mut loop_history = History::new(loop_var_names);

    let ptu_var_names = vec![
        "Current flow".to_string(),
        "Press delta".to_string(),
        "PTU active GREEN".to_string(),
        "PTU active YELLOW".to_string(),
    ];
    let mut ptu_history = History::new(ptu_var_names);

    let green_acc_var_names = vec![
        "Loop Pressure".to_string(),
        "Acc gas press".to_string(),
        "Acc fluid vol".to_string(),
        "Acc gas vol".to_string(),
    ];
    let mut accu_green_history = History::new(green_acc_var_names);

    let yellow_acc_var_names = vec![
        "Loop Pressure".to_string(),
        "Acc gas press".to_string(),
        "Acc fluid vol".to_string(),
        "Acc gas vol".to_string(),
    ];
    let mut accu_yellow_history = History::new(yellow_acc_var_names);

    let mut epump = electric_pump();
    let mut epump_controller = TestPumpController::commanding_depressurise();
    let mut yellow_loop = hydraulic_loop("YELLOW");

    let mut edp1 = engine_driven_pump();
    let mut edp1_controller = TestPumpController::commanding_depressurise();

    let mut green_loop = hydraulic_loop("GREEN");

    let loop_controller = TestHydraulicLoopController::commanding_open_fire_shutoff_valve();

    let mut ptu = PowerTransferUnit::new();
    let mut ptu_controller = TestPowerTransferUnitController::commanding_disabled();

    let context = context(Duration::from_millis(100));

    loop_history.init(
        0.0,
        vec![
            green_loop.pressure().get::<psi>(),
            yellow_loop.pressure().get::<psi>(),
            green_loop.reservoir_volume().get::<gallon>(),
            yellow_loop.reservoir_volume().get::<gallon>(),
            green_loop.current_delta_vol().get::<gallon>(),
            yellow_loop.current_delta_vol().get::<gallon>(),
        ],
    );
    ptu_history.init(
        0.0,
        vec![
            ptu.flow().get::<gallon_per_second>(),
            green_loop.pressure().get::<psi>() - yellow_loop.pressure().get::<psi>(),
            ptu.is_active_left_to_right() as i8 as f64,
            ptu.is_active_right_to_left() as i8 as f64,
        ],
    );
    accu_green_history.init(
        0.0,
        vec![
            green_loop.pressure().get::<psi>(),
            green_loop.accumulator_gas_pressure().get::<psi>(),
            green_loop.accumulator_fluid_volume().get::<gallon>(),
            green_loop.accumulator_gas_volume().get::<gallon>(),
        ],
    );
    accu_yellow_history.init(
        0.0,
        vec![
            yellow_loop.pressure().get::<psi>(),
            yellow_loop.accumulator_gas_pressure().get::<psi>(),
            yellow_loop.accumulator_fluid_volume().get::<gallon>(),
            yellow_loop.accumulator_gas_volume().get::<gallon>(),
        ],
    );

    let yellow_res_at_start = yellow_loop.reservoir_volume();
    let green_res_at_start = green_loop.reservoir_volume();

    let edp_rpm = 3300.;
    for x in 0..800 {
        if x == 10 {
            // After 1s powering electric pump
            println!("------------YELLOW EPUMP ON------------");
            assert!(yellow_loop.pressure() <= Pressure::new::<psi>(50.0));
            assert!(yellow_loop.reservoir_volume() == yellow_res_at_start);

            assert!(green_loop.pressure() <= Pressure::new::<psi>(50.0));
            assert!(green_loop.reservoir_volume() == green_res_at_start);

            epump_controller.command_pressurise();
        }

        if x == 110 {
            // 10s later enabling ptu
            println!("--------------PTU ENABLED--------------");
            assert!(yellow_loop.pressure() >= Pressure::new::<psi>(2950.0));
            assert!(yellow_loop.reservoir_volume() <= yellow_res_at_start);

            assert!(green_loop.pressure() <= Pressure::new::<psi>(50.0));
            assert!(green_loop.reservoir_volume() == green_res_at_start);

            ptu_controller.command_enable();
        }

        if x == 300 {
            // @30s, ptu should be supplying green loop
            println!("----------PTU SUPPLIES GREEN------------");
            assert!(yellow_loop.pressure() >= Pressure::new::<psi>(2400.0));
            assert!(green_loop.pressure() >= Pressure::new::<psi>(2400.0));
        }

        if x == 400 {
            // @40s enabling edp
            println!("------------GREEN  EDP1  ON------------");
            assert!(yellow_loop.pressure() >= Pressure::new::<psi>(2600.0));
            assert!(green_loop.pressure() >= Pressure::new::<psi>(2000.0));
            edp1_controller.command_pressurise();
        }

        if (500..=600).contains(&x) {
            // 10s later and during 10s, ptu should stay inactive
            println!("------------IS PTU ACTIVE??------------");
            assert!(yellow_loop.pressure() >= Pressure::new::<psi>(2900.0));
            assert!(green_loop.pressure() >= Pressure::new::<psi>(2900.0));
        }

        if x == 600 {
            // @60s diabling edp and epump
            println!("-------------ALL PUMPS OFF------------");
            assert!(yellow_loop.pressure() >= Pressure::new::<psi>(2900.0));
            assert!(green_loop.pressure() >= Pressure::new::<psi>(2900.0));
            edp1_controller.command_depressurise();
            epump_controller.command_depressurise();
        }

        if x == 800 {
            // @80s diabling edp and epump
            println!("-----------IS PRESSURE OFF?-----------");
            assert!(yellow_loop.pressure() < Pressure::new::<psi>(50.0));
            assert!(green_loop.pressure() <= Pressure::new::<psi>(50.0));

            assert!(
                green_loop.reservoir_volume() > Volume::new::<gallon>(0.0)
                    && green_loop.reservoir_volume() <= green_res_at_start
            );
            assert!(
                yellow_loop.reservoir_volume() > Volume::new::<gallon>(0.0)
                    && yellow_loop.reservoir_volume() <= yellow_res_at_start
            );
        }

        ptu.update(&green_loop, &yellow_loop, &ptu_controller);
        edp1.update(
            &context,
            &green_loop,
            AngularVelocity::new::<revolution_per_minute>(edp_rpm),
            &edp1_controller,
        );
        epump.update(&context, &yellow_loop, &epump_controller);

        yellow_loop.update(
            &context,
            vec![&epump],
            Vec::new(),
            Vec::new(),
            vec![&ptu],
            &loop_controller,
        );
        green_loop.update(
            &context,
            Vec::new(),
            vec![&edp1],
            Vec::new(),
            vec![&ptu],
            &loop_controller,
        );

        loop_history.update(
            context.delta_as_secs_f64(),
            vec![
                green_loop.pressure().get::<psi>(),
                yellow_loop.pressure().get::<psi>(),
                green_loop.reservoir_volume().get::<gallon>(),
                yellow_loop.reservoir_volume().get::<gallon>(),
                green_loop.current_delta_vol().get::<gallon>(),
                yellow_loop.current_delta_vol().get::<gallon>(),
            ],
        );
        ptu_history.update(
            context.delta_as_secs_f64(),
            vec![
                ptu.flow().get::<gallon_per_second>(),
                green_loop.pressure().get::<psi>() - yellow_loop.pressure().get::<psi>(),
                ptu.is_active_left_to_right() as i8 as f64,
                ptu.is_active_right_to_left() as i8 as f64,
            ],
        );

        accu_green_history.update(
            context.delta_as_secs_f64(),
            vec![
                green_loop.pressure().get::<psi>(),
                green_loop.accumulator_gas_pressure().get::<psi>(),
                green_loop.accumulator_fluid_volume().get::<gallon>(),
                green_loop.accumulator_gas_volume().get::<gallon>(),
            ],
        );
        accu_yellow_history.update(
            context.delta_as_secs_f64(),
            vec![
                yellow_loop.pressure().get::<psi>(),
                yellow_loop.accumulator_gas_pressure().get::<psi>(),
                yellow_loop.accumulator_fluid_volume().get::<gallon>(),
                yellow_loop.accumulator_gas_volume().get::<gallon>(),
            ],
        );

        if x % 20 == 0 {
            println!("Iteration {}", x);
            println!("-------------------------------------------");
            println!("---PSI YELLOW: {}", yellow_loop.pressure().get::<psi>());
            println!("---RPM YELLOW: {}", epump.rpm());
            println!(
                "---Priming State: {}/{}",
                yellow_loop.loop_fluid_volume().get::<gallon>(),
                yellow_loop.max_volume().get::<gallon>()
            );
            println!("---PSI GREEN: {}", green_loop.pressure().get::<psi>());
            println!("---EDP RPM GREEN: {}", edp_rpm);
            println!(
                "---Priming State: {}/{}",
                green_loop.loop_fluid_volume().get::<gallon>(),
                green_loop.max_volume().get::<gallon>()
            );
        }
    }

    loop_history.show_matplotlib("yellow_green_ptu_loop_simulation()_Loop_press", &path);
    ptu_history.show_matplotlib("yellow_green_ptu_loop_simulation()_PTU", &path);

    accu_green_history.show_matplotlib("yellow_green_ptu_loop_simulation()_Green_acc", &path);
    accu_yellow_history.show_matplotlib("yellow_green_ptu_loop_simulation()_Yellow_acc", &path);
}

fn yellow_epump_plus_edp2_with_ptu(path: &str) {
    let loop_var_names = vec![
        "GREEN Loop Pressure".to_string(),
        "YELLOW Loop Pressure".to_string(),
        "GREEN Loop reservoir".to_string(),
        "YELLOW Loop reservoir".to_string(),
        "GREEN Loop delta vol".to_string(),
        "YELLOW Loop delta vol".to_string(),
    ];
    let mut loop_history = History::new(loop_var_names);

    let ptu_var_names = vec![
        "Current flow".to_string(),
        "Press delta".to_string(),
        "PTU active GREEN".to_string(),
        "PTU active YELLOW".to_string(),
    ];
    let mut ptu_history = History::new(ptu_var_names);

    let green_acc_var_names = vec![
        "Loop Pressure".to_string(),
        "Acc gas press".to_string(),
        "Acc fluid vol".to_string(),
        "Acc gas vol".to_string(),
    ];
    let mut accu_green_history = History::new(green_acc_var_names);

    let yellow_acc_var_names = vec![
        "Loop Pressure".to_string(),
        "Acc gas press".to_string(),
        "Acc fluid vol".to_string(),
        "Acc gas vol".to_string(),
    ];
    let mut accu_yellow_history = History::new(yellow_acc_var_names);

    let mut epump = electric_pump();
    let mut epump_controller = TestPumpController::commanding_depressurise();
    let mut yellow_loop = hydraulic_loop("YELLOW");

    let mut edp2 = engine_driven_pump();
    let mut edp2_controller = TestPumpController::commanding_depressurise();

    let edp_rpm = 3300.;

    let mut green_loop = hydraulic_loop("GREEN");

    let loop_controller = TestHydraulicLoopController::commanding_open_fire_shutoff_valve();

    let mut ptu = PowerTransferUnit::new();
    let ptu_controller = TestPowerTransferUnitController::commanding_enabled();

    let context = context(Duration::from_millis(100));

    loop_history.init(
        0.0,
        vec![
            green_loop.pressure().get::<psi>(),
            yellow_loop.pressure().get::<psi>(),
            green_loop.reservoir_volume().get::<gallon>(),
            yellow_loop.reservoir_volume().get::<gallon>(),
            green_loop.current_delta_vol().get::<gallon>(),
            yellow_loop.current_delta_vol().get::<gallon>(),
        ],
    );
    ptu_history.init(
        0.0,
        vec![
            ptu.flow().get::<gallon_per_second>(),
            green_loop.pressure().get::<psi>() - yellow_loop.pressure().get::<psi>(),
            ptu.is_active_left_to_right() as i8 as f64,
            ptu.is_active_right_to_left() as i8 as f64,
        ],
    );
    accu_green_history.init(
        0.0,
        vec![
            green_loop.pressure().get::<psi>(),
            green_loop.accumulator_gas_pressure().get::<psi>(),
            green_loop.accumulator_fluid_volume().get::<gallon>(),
            green_loop.accumulator_gas_volume().get::<gallon>(),
        ],
    );
    accu_yellow_history.init(
        0.0,
        vec![
            yellow_loop.pressure().get::<psi>(),
            yellow_loop.accumulator_gas_pressure().get::<psi>(),
            yellow_loop.accumulator_fluid_volume().get::<gallon>(),
            yellow_loop.accumulator_gas_volume().get::<gallon>(),
        ],
    );

    for x in 0..800 {
        if x == 10 {
            // After 1s powering electric pump
            epump_controller.command_pressurise();
        }

        if x == 110 {
            // 10s later enabling edp2
            edp2_controller.command_pressurise();
        }

        if x >= 400 {
            println!("Gpress={}", green_loop.pressure().get::<psi>());
        }
        ptu.update(&green_loop, &yellow_loop, &ptu_controller);
        edp2.update(
            &context,
            &yellow_loop,
            AngularVelocity::new::<revolution_per_minute>(edp_rpm),
            &edp2_controller,
        );
        epump.update(&context, &yellow_loop, &epump_controller);

        yellow_loop.update(
            &context,
            vec![&epump],
            vec![&edp2],
            Vec::new(),
            vec![&ptu],
            &loop_controller,
        );
        green_loop.update(
            &context,
            Vec::new(),
            Vec::new(),
            Vec::new(),
            vec![&ptu],
            &loop_controller,
        );

        loop_history.update(
            context.delta_as_secs_f64(),
            vec![
                green_loop.pressure().get::<psi>(),
                yellow_loop.pressure().get::<psi>(),
                green_loop.reservoir_volume().get::<gallon>(),
                yellow_loop.reservoir_volume().get::<gallon>(),
                green_loop.current_delta_vol().get::<gallon>(),
                yellow_loop.current_delta_vol().get::<gallon>(),
            ],
        );
        ptu_history.update(
            context.delta_as_secs_f64(),
            vec![
                ptu.flow().get::<gallon_per_second>(),
                green_loop.pressure().get::<psi>() - yellow_loop.pressure().get::<psi>(),
                ptu.is_active_left_to_right() as i8 as f64,
                ptu.is_active_right_to_left() as i8 as f64,
            ],
        );

        accu_green_history.update(
            context.delta_as_secs_f64(),
            vec![
                green_loop.pressure().get::<psi>(),
                green_loop.accumulator_gas_pressure().get::<psi>(),
                green_loop.accumulator_fluid_volume().get::<gallon>(),
                green_loop.accumulator_gas_volume().get::<gallon>(),
            ],
        );
        accu_yellow_history.update(
            context.delta_as_secs_f64(),
            vec![
                yellow_loop.pressure().get::<psi>(),
                yellow_loop.accumulator_gas_pressure().get::<psi>(),
                yellow_loop.accumulator_fluid_volume().get::<gallon>(),
                yellow_loop.accumulator_gas_volume().get::<gallon>(),
            ],
        );
    }

    loop_history.show_matplotlib("yellow_epump_plus_edp2_with_ptu()_Loop_press", &path);
    ptu_history.show_matplotlib("yellow_epump_plus_edp2_with_ptu()_PTU", &path);

    accu_green_history.show_matplotlib("yellow_epump_plus_edp2_with_ptu()_Green_acc", &path);
    accu_yellow_history.show_matplotlib("yellow_epump_plus_edp2_with_ptu()_Yellow_acc", &path);
}

fn hydraulic_loop(loop_color: &str) -> HydraulicLoop {
    match loop_color {
        "GREEN" => HydraulicLoop::new(
            loop_color,
            true,
            false,
            Volume::new::<gallon>(26.41),
            Volume::new::<gallon>(26.41),
            Volume::new::<gallon>(10.0),
            Volume::new::<gallon>(3.83),
            Fluid::new(Pressure::new::<pascal>(1450000000.0)),
            true,
            Pressure::new::<psi>(1450.),
            Pressure::new::<psi>(1750.),
        ),
        "YELLOW" => HydraulicLoop::new(
            loop_color,
            false,
            true,
            Volume::new::<gallon>(10.2),
            Volume::new::<gallon>(10.2),
            Volume::new::<gallon>(8.0),
            Volume::new::<gallon>(3.3),
            Fluid::new(Pressure::new::<pascal>(1450000000.0)),
            true,
            Pressure::new::<psi>(1450.),
            Pressure::new::<psi>(1750.),
        ),
        _ => HydraulicLoop::new(
            loop_color,
            false,
            false,
            Volume::new::<gallon>(15.85),
            Volume::new::<gallon>(15.85),
            Volume::new::<gallon>(8.0),
            Volume::new::<gallon>(1.5),
            Fluid::new(Pressure::new::<pascal>(1450000000.0)),
            false,
            Pressure::new::<psi>(1450.),
            Pressure::new::<psi>(1750.),
        ),
    }
}

fn electric_pump() -> ElectricPump {
    ElectricPump::new("DEFAULT", ElectricalBusType::AlternatingCurrentEssential)
}

fn engine_driven_pump() -> EngineDrivenPump {
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
        Acceleration::new::<foot_per_second_squared>(0.),
        Acceleration::new::<foot_per_second_squared>(0.),
        Angle::new::<radian>(0.),
        Angle::new::<radian>(0.),
    )
}
