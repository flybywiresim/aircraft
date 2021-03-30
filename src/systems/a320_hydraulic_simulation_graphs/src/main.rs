use systems::simulation::UpdateContext;
use systems::engine::Engine;
pub use systems::hydraulic::*;

use std::time::Duration;
use uom::si::{
    ratio::percent,
    acceleration::foot_per_second_squared,
    f64::*,
    length::foot,
    pressure::{pascal, psi},
    thermodynamic_temperature::degree_celsius,
    time::second,
    volume::{gallon, liter},
    volume_rate::gallon_per_second,
    velocity::knot,
};

use plotlib::page::Page;
use plotlib::repr::Plot;
use plotlib::style::LineStyle;
use plotlib::view::ContinuousView;

extern crate rustplotlib;
use rustplotlib::Figure;



fn main() {
    println!("Launching hyd simulation...");

    green_loop_edp_simulation();
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
                    //.marker("x")
                    //.linestyle("--")
                    .linewidth(1.0),
            )
            .xlabel("Time [sec]")
            .ylabel(h.name_vector[idx].as_str())
            .legend("best")
            .xlim(0.0, *h.time_vector.last().unwrap());
        //.ylim(-2.0, 2.0);

        curr_axis = curr_axis.grid(true);
        all_axis.push(Some(curr_axis));
    }

    Figure::new().subplots(all_axis.len() as u32, 1, all_axis)
}

//History class to record a simulation
pub struct History {
    time_vector: Vec<f64>,      //Simulation time starting from 0
    name_vector: Vec<String>,   //Name of each var saved
    data_vector: Vec<Vec<f64>>, //Vector data for each var saved
    _data_size: usize,
}

impl History {
    pub fn new(names: Vec<String>) -> History {
        History {
            time_vector: Vec::new(),
            name_vector: names.clone(),
            data_vector: Vec::new(),
            _data_size: names.len(),
        }
    }

    //Sets initialisation values of each data before first step
    pub fn init(&mut self, start_time: f64, values: Vec<f64>) {
        self.time_vector.push(start_time);
        for v in values {
            self.data_vector.push(vec![v]);
        }
    }

    //Updates all values and time vector
    pub fn update(&mut self, delta_time: f64, values: Vec<f64>) {
        self.time_vector
            .push(self.time_vector.last().unwrap() + delta_time);
        self.push_data(values);
    }

    pub fn push_data(&mut self, values: Vec<f64>) {
        for (idx, v) in values.iter().enumerate() {
            self.data_vector[idx].push(*v);
        }
    }

    //Builds a graph using rust crate plotlib
    pub fn _show(self) {
        let mut v = ContinuousView::new()
            .x_range(0.0, *self.time_vector.last().unwrap())
            .y_range(0.0, 3500.0)
            .x_label("Time (s)")
            .y_label("Value");

        for cur_data in self.data_vector {
            //Here build the 2 by Xsamples vector
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

    //builds a graph using matplotlib python backend. PYTHON REQUIRED AS WELL AS MATPLOTLIB PACKAGE
    pub fn show_matplotlib(&self, figure_title: &str) {
        let fig = make_figure(&self);

        use rustplotlib::backend::Matplotlib;
        use rustplotlib::Backend;
        let mut mpl = Matplotlib::new().unwrap();
        mpl.set_style("ggplot").unwrap();

        fig.apply(&mut mpl).unwrap();

        let _result = mpl.savefig(figure_title);

        mpl.wait().unwrap();
    }
}

//Runs engine driven pump, checks pressure OK, shut it down, check drop of pressure after 20s
fn green_loop_edp_simulation() {
    let green_loop_var_names = vec![
        "Loop Pressure".to_string(),
        "Loop Volume".to_string(),
        "Loop Reservoir".to_string(),
        "Loop Flow".to_string(),
    ];
    let mut green_loop_history = History::new(green_loop_var_names);

    let edp1_var_names = vec!["Delta Vol Max".to_string(), "n2 ratio".to_string()];
    let mut edp1_history = History::new(edp1_var_names);

    let mut edp1 = engine_driven_pump();
    let mut green_loop = hydraulic_loop("GREEN");
    edp1.active = true;

    let init_n2 = Ratio::new::<percent>(55.0);
    let engine1 = engine(init_n2);
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
            green_loop.loop_pressure.get::<psi>(),
            green_loop.loop_volume.get::<gallon>(),
            green_loop.reservoir_volume.get::<gallon>(),
            green_loop.current_flow.get::<gallon_per_second>(),
        ],
    );
    edp1_history.init(
        0.0,
        vec![
            edp1.get_delta_vol_max().get::<liter>(),
            engine1.corrected_n2.get::<percent>() as f64,
        ],
    );
    accu_green_history.init(
        0.0,
        vec![
            green_loop.loop_pressure.get::<psi>(),
            green_loop.accumulator_gas_pressure.get::<psi>(),
            green_loop.accumulator_fluid_volume.get::<gallon>(),
            green_loop.accumulator_gas_volume.get::<gallon>(),
        ],
    );
    for x in 0..600 {
        if x == 50 {
            //After 5s
            assert!(green_loop.loop_pressure >= Pressure::new::<psi>(2850.0));
        }
        if x == 200 {
            assert!(green_loop.loop_pressure >= Pressure::new::<psi>(2850.0));
            edp1.stop();
        }
        if x >= 500 {
            //Shutdown + 30s
            assert!(green_loop.loop_pressure <= Pressure::new::<psi>(250.0));
        }

        edp1.update(&context.delta(), &green_loop, &engine1);
        green_loop.update(
            &context.delta(),
            Vec::new(),
            vec![&edp1],
            Vec::new(),
            Vec::new(),
        );
        if x % 20 == 0 {
            println!("Iteration {}", x);
            println!("-------------------------------------------");
            println!("---PSI: {}", green_loop.loop_pressure.get::<psi>());
            println!(
                "--------Reservoir Volume (g): {}",
                green_loop.reservoir_volume.get::<gallon>()
            );
            println!(
                "--------Loop Volume (g): {}",
                green_loop.loop_volume.get::<gallon>()
            );
            println!(
                "--------Acc Fluid Volume (L): {}",
                green_loop.accumulator_fluid_volume.get::<liter>()
            );
            println!(
                "--------Acc Gas Volume (L): {}",
                green_loop.accumulator_gas_volume.get::<liter>()
            );
            println!(
                "--------Acc Gas Pressure (psi): {}",
                green_loop.accumulator_gas_pressure.get::<psi>()
            );
        }

        green_loop_history.update(
            context.delta().as_secs_f64(),
            vec![
                green_loop.loop_pressure.get::<psi>(),
                green_loop.loop_volume.get::<gallon>(),
                green_loop.reservoir_volume.get::<gallon>(),
                green_loop.current_flow.get::<gallon_per_second>(),
            ],
        );
        edp1_history.update(
            context.delta().as_secs_f64(),
            vec![
                edp1.get_delta_vol_max().get::<liter>(),
                engine1.corrected_n2.get::<percent>() as f64,
            ],
        );
        accu_green_history.update(
            context.delta().as_secs_f64(),
            vec![
                green_loop.loop_pressure.get::<psi>(),
                green_loop.accumulator_gas_pressure.get::<psi>(),
                green_loop.accumulator_fluid_volume.get::<gallon>(),
                green_loop.accumulator_gas_volume.get::<gallon>(),
            ],
        );
    }

    green_loop_history.show_matplotlib("green_loop_edp_simulation_press");
    edp1_history.show_matplotlib("green_loop_edp_simulation_EDP1 data");
    accu_green_history.show_matplotlib("green_loop_edp_simulation_Green Accum data");
}

fn yellow_green_ptu_loop_simulation() {
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
        "GREEN side flow".to_string(),
        "YELLOW side flow".to_string(),
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
    epump.stop();
    let mut yellow_loop = hydraulic_loop("YELLOW");

    let mut edp1 = engine_driven_pump();
    assert!(!edp1.active); //Is off when created?

    let mut engine1 = engine(Ratio::new::<percent>(0.0));

    let mut green_loop = hydraulic_loop("GREEN");

    let mut ptu = Ptu::new("");

    let context = context(Duration::from_millis(100));

    loop_history.init(
        0.0,
        vec![
            green_loop.loop_pressure.get::<psi>(),
            yellow_loop.loop_pressure.get::<psi>(),
            green_loop.reservoir_volume.get::<gallon>(),
            yellow_loop.reservoir_volume.get::<gallon>(),
            green_loop.current_delta_vol.get::<gallon>(),
            yellow_loop.current_delta_vol.get::<gallon>(),
        ],
    );
    ptu_history.init(
        0.0,
        vec![
            ptu.flow_to_left.get::<gallon_per_second>(),
            ptu.flow_to_right.get::<gallon_per_second>(),
            green_loop.loop_pressure.get::<psi>() - yellow_loop.loop_pressure.get::<psi>(),
            ptu.is_active_left as i8 as f64,
            ptu.is_active_right as i8 as f64,
        ],
    );
    accu_green_history.init(
        0.0,
        vec![
            green_loop.loop_pressure.get::<psi>(),
            green_loop.accumulator_gas_pressure.get::<psi>(),
            green_loop.accumulator_fluid_volume.get::<gallon>(),
            green_loop.accumulator_gas_volume.get::<gallon>(),
        ],
    );
    accu_yellow_history.init(
        0.0,
        vec![
            yellow_loop.loop_pressure.get::<psi>(),
            yellow_loop.accumulator_gas_pressure.get::<psi>(),
            yellow_loop.accumulator_fluid_volume.get::<gallon>(),
            yellow_loop.accumulator_gas_volume.get::<gallon>(),
        ],
    );

    let yellow_res_at_start = yellow_loop.reservoir_volume;
    let green_res_at_start = green_loop.reservoir_volume;

    engine1.corrected_n2 = Ratio::new::<percent>(100.0);
    for x in 0..800 {
        if x == 10 {
            //After 1s powering electric pump
            println!("------------YELLOW EPUMP ON------------");
            assert!(yellow_loop.loop_pressure <= Pressure::new::<psi>(50.0));
            assert!(yellow_loop.reservoir_volume == yellow_res_at_start);

            assert!(green_loop.loop_pressure <= Pressure::new::<psi>(50.0));
            assert!(green_loop.reservoir_volume == green_res_at_start);

            epump.start();
        }

        if x == 110 {
            //10s later enabling ptu
            println!("--------------PTU ENABLED--------------");
            assert!(yellow_loop.loop_pressure >= Pressure::new::<psi>(2950.0));
            assert!(yellow_loop.reservoir_volume <= yellow_res_at_start);

            assert!(green_loop.loop_pressure <= Pressure::new::<psi>(50.0));
            assert!(green_loop.reservoir_volume == green_res_at_start);

            ptu.enabling(true);
        }

        if x == 300 {
            //@30s, ptu should be supplying green loop
            println!("----------PTU SUPPLIES GREEN------------");
            assert!(yellow_loop.loop_pressure >= Pressure::new::<psi>(2400.0));
            assert!(green_loop.loop_pressure >= Pressure::new::<psi>(2400.0));
        }

        if x == 400 {
            //@40s enabling edp
            println!("------------GREEN  EDP1  ON------------");
            assert!(yellow_loop.loop_pressure >= Pressure::new::<psi>(2600.0));
            assert!(green_loop.loop_pressure >= Pressure::new::<psi>(2000.0));
            edp1.start();
        }

        if (500..=600).contains(&x) {
            //10s later and during 10s, ptu should stay inactive
            println!("------------IS PTU ACTIVE??------------");
            assert!(yellow_loop.loop_pressure >= Pressure::new::<psi>(2900.0));
            assert!(green_loop.loop_pressure >= Pressure::new::<psi>(2900.0));
            assert!(!ptu.is_active_left && !ptu.is_active_right);
        }

        if x == 600 {
            //@60s diabling edp and epump
            println!("-------------ALL PUMPS OFF------------");
            assert!(yellow_loop.loop_pressure >= Pressure::new::<psi>(2900.0));
            assert!(green_loop.loop_pressure >= Pressure::new::<psi>(2900.0));
            edp1.stop();
            epump.stop();
        }

        if x == 800 {
            //@80s diabling edp and epump
            println!("-----------IS PRESSURE OFF?-----------");
            assert!(yellow_loop.loop_pressure < Pressure::new::<psi>(50.0));
            assert!(green_loop.loop_pressure <= Pressure::new::<psi>(50.0));

            assert!(
                green_loop.reservoir_volume > Volume::new::<gallon>(0.0)
                    && green_loop.reservoir_volume <= green_res_at_start
            );
            assert!(
                yellow_loop.reservoir_volume > Volume::new::<gallon>(0.0)
                    && yellow_loop.reservoir_volume <= yellow_res_at_start
            );
        }

        ptu.update(&green_loop, &yellow_loop);
        edp1.update(&context.delta(), &green_loop, &engine1);
        epump.update(&context.delta(), &yellow_loop);

        yellow_loop.update(
            &context.delta(),
            vec![&epump],
            Vec::new(),
            Vec::new(),
            vec![&ptu],
        );
        green_loop.update(
            &context.delta(),
            Vec::new(),
            vec![&edp1],
            Vec::new(),
            vec![&ptu],
        );

        loop_history.update(
            context.delta().as_secs_f64(),
            vec![
                green_loop.loop_pressure.get::<psi>(),
                yellow_loop.loop_pressure.get::<psi>(),
                green_loop.reservoir_volume.get::<gallon>(),
                yellow_loop.reservoir_volume.get::<gallon>(),
                green_loop.current_delta_vol.get::<gallon>(),
                yellow_loop.current_delta_vol.get::<gallon>(),
            ],
        );
        ptu_history.update(
            context.delta().as_secs_f64(),
            vec![
                ptu.flow_to_left.get::<gallon_per_second>(),
                ptu.flow_to_right.get::<gallon_per_second>(),
                green_loop.loop_pressure.get::<psi>() - yellow_loop.loop_pressure.get::<psi>(),
                ptu.is_active_left as i8 as f64,
                ptu.is_active_right as i8 as f64,
            ],
        );

        accu_green_history.update(
            context.delta().as_secs_f64(),
            vec![
                green_loop.loop_pressure.get::<psi>(),
                green_loop.accumulator_gas_pressure.get::<psi>(),
                green_loop.accumulator_fluid_volume.get::<gallon>(),
                green_loop.accumulator_gas_volume.get::<gallon>(),
            ],
        );
        accu_yellow_history.update(
            context.delta().as_secs_f64(),
            vec![
                yellow_loop.loop_pressure.get::<psi>(),
                yellow_loop.accumulator_gas_pressure.get::<psi>(),
                yellow_loop.accumulator_fluid_volume.get::<gallon>(),
                yellow_loop.accumulator_gas_volume.get::<gallon>(),
            ],
        );

        if x % 20 == 0 {
            println!("Iteration {}", x);
            println!("-------------------------------------------");
            println!("---PSI YELLOW: {}", yellow_loop.loop_pressure.get::<psi>());
            println!("---RPM YELLOW: {}", epump.rpm);
            println!(
                "---Priming State: {}/{}",
                yellow_loop.loop_volume.get::<gallon>(),
                yellow_loop.max_loop_volume.get::<gallon>()
            );
            println!("---PSI GREEN: {}", green_loop.loop_pressure.get::<psi>());
            println!("---N2  GREEN: {}", engine1.corrected_n2.get::<percent>());
            println!(
                "---Priming State: {}/{}",
                green_loop.loop_volume.get::<gallon>(),
                green_loop.max_loop_volume.get::<gallon>()
            );
        }
    }

    loop_history.show_matplotlib("yellow_green_ptu_loop_simulation()_Loop_press");
    ptu_history.show_matplotlib("yellow_green_ptu_loop_simulation()_PTU");

    accu_green_history.show_matplotlib("yellow_green_ptu_loop_simulation()_Green_acc");
    accu_yellow_history.show_matplotlib("yellow_green_ptu_loop_simulation()_Yellow_acc");
}

fn hydraulic_loop(loop_color: &str) -> HydLoop {
    match loop_color {
        "GREEN" => HydLoop::new(
            loop_color,
            true,
            false,
            Volume::new::<gallon>(26.41),
            Volume::new::<gallon>(26.41),
            Volume::new::<gallon>(10.0),
            Volume::new::<gallon>(3.83),
            HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
            true,
        ),
        "YELLOW" => HydLoop::new(
            loop_color,
            false,
            true,
            Volume::new::<gallon>(10.2),
            Volume::new::<gallon>(10.2),
            Volume::new::<gallon>(8.0),
            Volume::new::<gallon>(3.3),
            HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
            true,
        ),
        _ => HydLoop::new(
            loop_color,
            false,
            false,
            Volume::new::<gallon>(15.85),
            Volume::new::<gallon>(15.85),
            Volume::new::<gallon>(8.0),
            Volume::new::<gallon>(1.5),
            HydFluid::new(Pressure::new::<pascal>(1450000000.0)),
            false,
        ),
    }
}

fn electric_pump() -> ElectricPump {
    ElectricPump::new("DEFAULT")
}

fn engine_driven_pump() -> EngineDrivenPump {
    EngineDrivenPump::new("DEFAULT")
}

fn engine(n2: Ratio) -> Engine {
    let mut engine = Engine::new(1);
    engine.corrected_n2 = n2;

    engine
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

struct PressureCaracteristic {
    pressure: Pressure,
    rpm_tab: Vec<f64>,
    flow_tab: Vec<f64>,
}


fn show_carac(figure_title: &str, output_caracteristics: &[PressureCaracteristic]) {
    use rustplotlib::{Axes2D, Line2D};

    let mut all_axis: Vec<Option<Axes2D>> = Vec::new();
    let colors = ["blue", "yellow", "red", "black", "cyan", "magenta", "green"];
    let linestyles = ["--", "-.", "-"];
    let mut curr_axis = Axes2D::new();
    curr_axis = curr_axis.grid(true);
    let mut color_idx = 0;
    let mut style_idx = 0;
    for cur_pressure in output_caracteristics {
        let press_str = format!("P={:.0}", cur_pressure.pressure.get::<psi>());
        curr_axis = curr_axis
            .add(
                Line2D::new(press_str.as_str())
                    .data(&cur_pressure.rpm_tab, &cur_pressure.flow_tab)
                    .color(colors[color_idx])
                    //.marker("x")
                    .linestyle(linestyles[style_idx])
                    .linewidth(1.0),
            )
            .xlabel("RPM")
            .ylabel("Max Flow")
            .legend("best")
            .xlim(0.0, *cur_pressure.rpm_tab.last().unwrap());
        //.ylim(-2.0, 2.0);
        color_idx = (color_idx + 1) % colors.len();
        style_idx = (style_idx + 1) % linestyles.len();
    }
    all_axis.push(Some(curr_axis));
    let fig = Figure::new().subplots(all_axis.len() as u32, 1, all_axis);

    use rustplotlib::backend::Matplotlib;
    use rustplotlib::Backend;
    let mut mpl = Matplotlib::new().unwrap();
    mpl.set_style("ggplot").unwrap();

    fig.apply(&mut mpl).unwrap();

    let _result = mpl.savefig(figure_title);

    mpl.wait().unwrap();
}

fn epump_charac() {
    let mut output_caracteristics: Vec<PressureCaracteristic> = Vec::new();
    let mut epump = ElectricPump::new("YELLOW");
    let context = context(Duration::from_secs_f64(0.0001)); //Small dt to freeze spool up effect

    let mut green_loop = hydraulic_loop("GREEN");

    epump.start();
    for pressure in (0..3500).step_by(500) {
        let mut rpm_tab: Vec<f64> = Vec::new();
        let mut flow_tab: Vec<f64> = Vec::new();
        for rpm in (0..10000).step_by(150) {
            green_loop.loop_pressure = Pressure::new::<psi>(pressure as f64);
            epump.rpm = rpm as f64;
            epump.update(&context.delta(), &green_loop);
            rpm_tab.push(rpm as f64);
            let flow = epump.get_delta_vol_max()
                / Time::new::<second>(context.delta().as_secs_f64());
            let flow_gal = flow.get::<gallon_per_second>() as f64;
            flow_tab.push(flow_gal);
        }
        output_caracteristics.push(PressureCaracteristic {
            pressure: green_loop.loop_pressure,
            rpm_tab,
            flow_tab,
        });
    }
    show_carac("Epump_carac", &output_caracteristics);
}

fn engine_d_pump_charac() {
    let mut output_caracteristics: Vec<PressureCaracteristic> = Vec::new();
    let mut edpump = EngineDrivenPump::new("GREEN");

    let mut green_loop = hydraulic_loop("GREEN");
    let mut engine1 = engine(Ratio::new::<percent>(0.0));

    edpump.start();
    let context = context(Duration::from_secs_f64(1.0)); //Small dt to freeze spool up effect

    edpump.update(&context.delta(), &green_loop, &engine1);
    for pressure in (0..3500).step_by(500) {
        let mut rpm_tab: Vec<f64> = Vec::new();
        let mut flow_tab: Vec<f64> = Vec::new();
        for rpm in (0..10000).step_by(150) {
            green_loop.loop_pressure = Pressure::new::<psi>(pressure as f64);

            engine1.corrected_n2 = Ratio::new::<percent>(
                (rpm as f64)
                    / (EngineDrivenPump::PUMP_N2_GEAR_RATIO
                        * EngineDrivenPump::LEAP_1A26_MAX_N2_RPM),
            );
            edpump.update(&context.delta(), &green_loop, &engine1);
            rpm_tab.push(rpm as f64);
            let flow = edpump.get_delta_vol_max()
                / Time::new::<second>(context.delta().as_secs_f64());
            let flow_gal = flow.get::<gallon_per_second>() as f64;
            flow_tab.push(flow_gal);
        }
        output_caracteristics.push(PressureCaracteristic {
            pressure: green_loop.loop_pressure,
            rpm_tab,
            flow_tab,
        });
    }
    show_carac("Eng_Driv_pump_carac", &output_caracteristics);
}
