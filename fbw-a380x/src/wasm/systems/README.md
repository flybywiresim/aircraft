This folder contains code for simulating Airbus aircraft systems. Please read through the [guidelines](guidelines.md) and keep yourself up to date with those guidelines as they might change over time. We also highly recommend reading through this document to get an overview of the software design.

# How to build

Follow the steps below if you want to build the content of this folder without using the repository's standard build process.

1. Install the `wasm32-wasi` target by running: `rustup target add wasm32-wasi`.
2. Install LLVM 12 which can be found [here](https://releases.llvm.org/download.html), ensure to add it to your PATH.
3. Run `cargo build --target wasm32-wasi` in the console at the top-level of the a32nx repository. You must have the SDK installed and have the 'Samples' folder of the SDK downloaded (this must be acquired seperately from the core) in order to build `msfs-rs`.
4. The `lib.rs` file is built as `target/wasm32-wasi/debug/a320.wasm`.

# Software design

Good software design makes implementing new features easier. Good software design should primarily focus on defining the structural concepts that exist in the software. The amount of concepts should be limited, as to not overburden those who develop within it with the continuous question of: "should I use concept x or y to do z?".

It is with this in mind that the systems' design was created.

## Requirements

Before going through the requirements, we first list some definitions:

* **System**: Does not refer to a software system but to a part of the aircraft, i.e. electrical system.
* **Model**: The part of the software that relates to actual parts of the aircraft, e.g. `ElectricalSystem`, `Engine`, `EngineGenerator`, etc.
* **Software**: The thing we're building.

### 1. Runs outside the simulator

The software should be testable outside of the simulator by running it in unit tests or a console application.

### 2. Simulator interactions outside the model

To aid in achieving requirement 1, interactions between the simulator and the model should be separated such that the model is unaware of the simulator's existence.

### 3. Guarantee consistent state

Each update of the model should leave the model in a consistent state. Requiring multiple "ticks" to reach the correct state is not acceptable and should only be done when there is absolutely no way around it. The programming model should make it easy to ensure this is guaranteed.

### 4. Observable state

A subset of systems requires observing the state of parts of the model, without the model itself having to be aware of such requirements. Two examples of such feature requirements are:

* The ability to play different sounds for the opening and closing of contactors in the electrical system.
* Showing faults and actions on the Lower ECAM.

### 5. Reuse in multiple Airbus aircraft types

Some parts of the model can be reused for multiple Airbus types. For example: while the decision which contactors in the electrical system are opened and closed is a type specific decision, the fact that such an electrical system contains buses, contactors, generators, etc. is true for all aircraft.

### 6. Starting state for different phases of flight

The model should be easily initialisable to different stages of flight, including cold and dark, on the runway and in flight.

### 7. Unit tests are mandatory

Testing the software automatically is key to quick and relatively error-free development. Thus, unit and integration (not with MSFS but combining pieces of the model) testing must be fully supported and is mandatory.

### 8. No confusion about units

The simulator exposes data in various forms, as pound, kilo, liter, gallon, volts, ampere, etc. This might lead to confusion during development and therefore should be mitigated.

## Implementation

### 1. Runs outside the simulator

To handle this requirement, parts of the software that interact with the simulator should be located outside of the part of the software that models the systems. It is therefore an onion-like design.

In the code below, the `A320` and `Simulation` types are unaware of the fact they're running inside a simulator. Thus those types and all the types they refer to can run without running the simulator.

```rust
#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn std::error::Error>> {
    let mut reader_writer = A320SimulatorReaderWriter::new()?;
    let mut a320 = A320::new();
    let mut simulation = Simulation::new(&mut a320, &mut reader_writer);

    while let Some(event) = gauge.next_event().await {
        if let MSFSEvent::PreDraw(d) = event {
            simulation.tick(d.delta_time());
        }
    }

    Ok(())
}
```

### 2. Simulator interactions outside the model

A simulation that doesn't interact with the simulator is pointless, thus to enable interaction the `Simulation` type runs through various phases. The primary phases are:

1. Reading data from the simulator into the simulation model.
2. Executing the simulation.
3. Writing data from the simulation model into the simulator.

A visitor is used for phase 1 and 3. A visitor is useful because code outside of the model doesn't have to be aware of the internal structure, and thus things are easier to change over time.

#### Visitor

The `SimulationElement` trait is the primary means of making an element visitable and enabling reading and writing of information from it. When you implement the `SimulationElement` for a type, by default it will visit that type but nothing else:

```rust
pub trait SimulationElement {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        visitor.visit(self);
    }
}
```

If the type you're implementing `SimulationElement` for is composed of other `SimulationElement` types, be sure to further expand the `accept` function:

```rust
impl SimulationElement for A320 {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        // These types are all a SimulationElement as well.
        self.apu.accept(visitor);
        self.apu_fire_overhead.accept(visitor);
        self.apu_overhead.accept(visitor);

        // Don't forget to visit yourself
        visitor.visit(self);
    }
}
```

#### Reading information from the simulator

The `SimulationElement` trait contains the `read` and `write` functions. `read` can be used to read information from the simulator:

```rust
pub struct Engine {
    corrected_n2_id: String,
    corrected_n2: Ratio,
}
impl Engine {
    pub fn new(number: usize) -> Engine {
        Engine {
            corrected_n2_id: format!("TURB ENG CORRECTED N2:{}", number),
            corrected_n2: Ratio::new::<percent>(0.),
        }
    }
}
impl SimulationElement for Engine {
    fn read(&mut self, reader: &mut SimulatorReader) {
        // As this function is invoked for every simulation tick
        // we try not to format the string here, but instead do it
        // once in the constructor function.
        self.corrected_n2 = Ratio::new::<percent>(reader.read_f64(&self.corrected_n2_id));
    }
}
```

#### Writing information to the simulator

`write` can be used to write information to the simulator:
```rust
impl<T: ApuGenerator, U: ApuStartMotor> SimulationElement for AuxiliaryPowerUnit<T, U> {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_f64(
            "APU_FLAP_OPEN_PERCENTAGE",
            self.air_intake_flap.open_amount().get::<percent>(),
        );
        writer.write_bool("APU_BLEED_AIR_VALVE_OPEN", self.bleed_air_valve_is_open());
    }
}
```

At the moment, we can only read and write the `f64` type. As a `bool` can be represented as an `f64`, we also support that particular type.

#### A32NX prefix

One doesn't have to prefix the variable name with `A32NX_` as this prefix is automatically added by the code in the `a320_systems_wasm` project.

#### Reading aircraft variables

Reading of aircraft variables requires slightly more work. To make that work, define the `AircraftVariable` in the `A320SimulatorReaderWriter` and add it to the `read` function in that type:

```rust
fn read(&mut self, name: &str) -> f64 {
        match name {
            "OVHD_ELEC_APU_GEN_PB_IS_ON" => self.apu_generator_pb_on.get(),
            // ...
        }
}
```
Note that the string used here is the name by which you should refer to the variable in the part of the code that is unaware of the simulator.

### 3. Guarantee consistent state

Achieving a consistent state requires that any dependencies between calculations are clearly visible. For example, to determine if the APU start motor is powered, we first need to determine the state of the electrical system. The state of the electrical system also requires the APU state to be known, thus creating a circular dependency. We make these dependencies clear as follows:

```rust
impl Aircraft for A320 {
    fn update_before_power_distribution(&mut self, context: &UpdateContext) {
        self.apu.update_before_electrical(
            context,
            // ...
        );

        self.electrical.update(
            context,
            // ...
            &mut A320ElectricalUpdateArguments::new(
                // ...
                &mut self.apu,
                // ...
            ),
        );

        self.apu.update_after_electrical();
        self.electrical_overhead
            .update_after_electrical(&self.electrical);
        self.apu_overhead.update_after_apu(&self.apu);
```

By passing around information instead of holding "global" references we can guarantee consistent state.

#### Module dependencies

The APU and electrical system are defined in separate modules. To ensure ease of testing we try to reduce the number of dependencies of a module. In the above example, the APU gets passed to `A320ElectricalUpdateArguments` which in fact doesn't expect an actual APU instance, but an instance implementing the `AuxiliaryPowerUnitElectrical` trait. That trait can be found in `systems/shared`. As a result the A320 electrical system can be tested without pulling in the full APU implementation.

### 4. Observable state

My first thought on this was to introduce some form of publish/subscribe which would expose changes made within the model to the outside as events. However, this would introduce another concept and could also increases the number of responsibilities we give to the model itself. I mentioned in the introduction that "the amount of concepts should be limited". Therefore, we should use the visitor pattern for this purpose as well.

Thus far this has worked out fine.

### 5. Reuse in multiple Airbus aircraft types

By adhering to requirement 1 and 2, we can already try to implement parts of the A380 by composing types we created for the A320 in different ways. Certain minor differences, such as the cooling coefficient of an engine generator which might differ per type of engine can be implemented by providing them as input to the `new` (constructor) function.

### 6. Starting state for different phases of flight

At the moment the various `.flt` files are used to start in the correct system state. Should these not be enough, the visitor pattern mentioned earlier can be used to apply different starting states to the model:

```rust
fn main() {
    let mut airbus = A320::new();

    // Ignore boxing for the sake of example simplicity.
    let startingStateVisitor = match starting_state {
        StartingState::ColdAndDark => ColdAndDarkStartVisitor {},
        StartingState::InFlight => InFlightStartVisitor {},
        // etc.
    }

    airbus.accept(&startingStateVisitor);
}
```

### 7. Unit tests

**Unit tests are mandatory. Contributions without a complete unit test suite are not approved.**

Unit tests can easily be implemented due to us having successfully abstracted away the simulator. The project contains various tools to help you in your unit testing. The `SimulationTestBed` type can be used to execute a full simulation tick on an `Aircraft` or `SimulationElement` you pass to it. Read the documentation on that type for more information.

For readability of tests and as the number of situations to test is rather large, I highly recommend using builder-like testing types:

```rust
#[test]
fn contactor_opens_after_three_minutes_of_being_closed_for_apu_start_in_emergency_elec() {
    let test_bed = test_bed_with()
        .emergency_elec()
        .available_emergency_generator()
        .and()
        .apu_master_sw_pb_on()
        .run(Duration::from_secs(
            ClosedContactorObserver::EMER_ELEC_APU_MASTER_MAXIMUM_CLOSED_SECONDS,
        ));

    assert!(!test_bed.battery_contactor_is_closed());
}
```

Refer to e.g. `battery_charge_limiter.rs` for a full implementation example.

### 8. No confusion about units

We use the [uom](https://github.com/iliekturtles/uom) crate for handling units.
