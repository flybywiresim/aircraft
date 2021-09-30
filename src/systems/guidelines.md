Please read through the guidelines described in this document. These guidelines are based upon pull request review comments. When reviewing pull requests, feel free to extend this document rather than repeating the same comment on pull requests over and over again.

# General

## Clippy

We enforce Clippy. We consider the vast majority of Clippy suggestions useful. Those that are disabled are described below:

### too_many_arguments

`too_many_arguments` attempts to reduce function dependencies by forcing you to consider creating additional structures to hold state you are passing into a function. In practice, aircraft systems have many dependencies, and restructuring these to reduce dependencies causes deviation from the real-world situation. Thus `#[allow(clippy::too_many_arguments)]` was used liberally in code, which is why we decided to disable this rule.

# Code

## Units of measurement

We use the [`uom`](https://crates.io/crates/uom) crate to provide us with units of measurement types. Whenever possible use these types instead of numeric types.

**Rationale:** Reduces the risk of computational errors such as mistaking a value in pounds with a value in kilograms. Using these types also reduces the risk of passing function arguments in the wrong order.

When reading and writing `uom` types using `SimulatorReader` and `SimulatorWriter`, don't convert to a specific unit unless the unit deviates from the default unit defined in [`systems/src/simulation/mod.rs`](systems/src/simulation/mod.rs).

**Rationale**: This leads to shorter and easier to read code. The default unit works for the majority of cases.

## Testing

Automated tests are mandatory.

### Level

Prefer component/integration tests which execute on one module or related group of modules over unit tests which test a single function. For example, when building the hydraulic system, consider executing all hydraulic update code for each test, while mocking (through traits) dependencies on e.g. the electrical system.

**Rationale:** The testing infrastructure was set up to make testing of modules easy. Testing at a higher level increases the amount of situations under which the full code is asserted.

### Duplication

Removing code duplication is less strictly enforced within tests. When a lot of repetition occurs, consider creating functions with a descriptive name on your custom `TestBed`.

**Rationale:** Having some duplication in tests may be valuable to make tests easier to read. As tests are not part of the resulting executed artefact, chances of duplication causing inconsistency problems are lower.

## `assert_eq!` and `assert_ne!`

Use `assert_eq!` and `assert_ne!` instead of `assert!(expression == expression)` and `assert!(expression != expression)`.

**Rationale**: Better test failure output and more explicit.

## Law of Demeter

Apply the [Law of Demeter](https://en.wikipedia.org/wiki/Law_of_Demeter). Do not write code which accesses data or functions through another piece of data. `foo.bar().baz()` breaks this law. `foo.bar()` does not.

**Rationale:** The Law of Demeter reduces coupling as only "immediate friends" are known by any piece of code. Loose coupling is a good thing.

## Explicit `match` pattern declaration

When using `match`, prefer explicit declaration of patterns over using `_`.

**Rationale:** When at another time additional enum variants are added the compiler will warn you about patterns that are not covered and thus helps in ensuring you consider the behaviour for these additional enum variant.

```rust
enum AutobrakeMode {
    NONE,
    LOW,
    MED,
    MAX,
    HIGH,
    RTO,
    BTV,
}

// INCORRECT
match self.mode {
    AutobrakeMode::NONE => // ...,
    AutobrakeMode::LOW | AutobrakeMode::MED => {
        // ...
    }
    _ => {
        // ...
    }
}

// CORRECT
match self.mode {
    AutobrakeMode::NONE => // ...,
    AutobrakeMode::LOW | AutobrakeMode::MED => {
        // ...
    }
    AutobrakeMode::MAX | AutobrakeMode::HIGH | AutobrakeMode::RTO | AutobrakeMode::BTV => {
        // ...
    }
}
```

Using `_` is okay for patterns which cannot be written to be explicitly complete (such as with number types). In such situations the `_` case should lead to a `panic!`.

**Rationale:** Has the same result as explicit pattern declaration described above, though of course only warns you at runtime instead of compile time.

```rust
enum PressureValveSignal {
    Open,
    Neutral,
    Close,
}

match value {
    0 => PressureValveSignal::Open,
    1 => PressureValveSignal::Neutral,
    2 => PressureValveSignal::Close,
    _ => panic!("{} cannot be converted into PressureValveSignal", value),
}
```

## Implicit Enum variant value

When writing an enum with simple variants, don't explicity define the value of each variant.

**Rationale**: There's no need to do so and thus this merely leads to time wasted on reading code.

```rust
// INCORRECT
enum FlapsConf {
    Conf0 = 0,
    Conf1 = 1,
    Conf1F = 2,
}

// CORRECT
enum FlapsConf {
    Conf0,
    Conf1,
    Conf1F,
}
```

## Prefer monomorphisation

Use type parameters instead of using `dyn`, effectively letting the compiler monomorphise types and functions.

**Rationale**: Monomorphisation is more performant during execution at the cost of increased compilation times. At the moment compilation time remains reasonable and as such we prefer execution performance over compile performance.

## Passing data around

Prefer passing structs over passing values read from structs.

**Rationale:** This avoids another type becoming responsible for deciding what data to pass around.

```rust
// INCORRECT
self.sfcc
    .update(context, self.flaps_handle.signal_new_position());
self.flap_gear.update(
    context,
    self.sfcc.signal_flap_movement(self.flap_gear.current_angle()),
);

// CORRECT
self.sfcc.update(
    context,
    &self.flaps_handle,
    &self.flap_gear,
);
self.flap_gear.update(context, &self.sfcc);
```

In the scenario mentioned above, prefer `&impl SomeTrait` arguments over `&SomeStruct` arguments.

**Rationale:** Easier code reuse, more generic, avoids bidirectional dependencies, and allows for application of [Interface Segregation Principle](https://en.wikipedia.org/wiki/Interface_segregation_principle).

## Do not re-read SimVars written by Rust code

SimVars that are written by Rust code should not be read by Rust code. Instead, pass around the structs containing the value to the locations that need the value.

```rust
// INCORRECT
impl SimulationElement for X {
    fn read(&mut self, reader: &mut SimulatorReader) {
        // HYD_GREEN_PRESSURE is written by the hydraulic system in Rust.
        self.hyd_green_pressure = reader.read("HYD_GREEN_PRESSURE");
    }
}

// CORRECT
impl X {
    fn uses_hyd_green_pressure(&mut self, green: &impl PressureSource) {
        self.hyd_green_pressure = green.pressure();
    }
}
```

## Avoid repeating trait `where` clauses

Commonly when implementing e.g. `SimulationElement`, code editors automatically generate functions shown below. The `where Self: Sized` clause can be removed, as the compiler already takes it from the trait definition.

**Reasoning:** Shorter code and no need to change all `where` clauses when the `where` clause on the trait itself changes.

```rust
// INCORRECT
fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
where
    Self: Sized,
{
    self.lo_button.accept(visitor);

    visitor.visit(self);
}

// CORRECT
fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
    self.lo_button.accept(visitor);

    visitor.visit(self);
}
```

## Avoid copying default trait function implementations

Avoid providing a function implementation which is equal to the default trait function implementation. A commonly reimplemented default trait function is `SimulationElement.accept`. The default implementation is shown below. The implementation always visits `self`, and thus there is no need to reimplement this function just to visit `self`.

```rust
fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
where
    Self: Sized,
{
    visitor.visit(self);
}
```

## Avoid `extern crate` usage

Avoid using `extern crate` imports whenever regular crate importing is possible.

```rust
// INCORRECT
extern crate nalgebra;
use nalgebra::Vector3;

// CORRECT
use nalgebra::Vector3;
```

**Rationale:** Using `extern crate` is no longer necessary for most cases in the 2018 edition of Rust. As it is more verbose it is no longer recommended to use it. See [here](https://doc.rust-lang.org/edition-guide/rust-2018/path-changes.html) for details.

## Limit item visibility

Limit the visibility of items such as `struct`s, fields, `fn` to the lowest visibility option. Note that Rust is distinctly different from many other languages with regards to visibility rules, so be sure to read up on them [here](https://doc.rust-lang.org/reference/visibility-and-privacy.html) if you don't know them in detail yet.

**Rationale:** By limiting visibility you reduce the public interface of items. This makes it easier to use and modify those items.

## Avoid dependencies between child modules

In a scenario where you have a parent module containing multiple child modules, avoid dependencies between the child modules by making the parent module responsible for handling communication between them. Often this means adding traits to the parent module and then implementing these in the child modules, such that children only import from `super::*`.

**Rationale:** Following this practice enforces coding to an interface instead of a concrete type and it reduces coupling.

## Single assignment for simple `if else`

Prefer having a single assignment over having an assignment in each of the branches of an `if else` expression whenever the content of each branch isn't more than a few lines.

**Rationale:** In Rust `if else` is an expression and is commonly used as such. Following this rule is more idiomatic Rust.

```rust
// INCORRECT
if self.delta_displacement >= Length::new::<meter>(0.) {
    self.value = volume_to_actuator;
} else {
    self.value = -volume_to_actuator;
}

// CORRECT
self.value = if self.delta_displacement >= Length::new::<meter>(0.) {
    volume_to_actuator
} else {
    -volume_to_actuator
};
```

# Style

## Formatting

The vast majority of code formatting is handled by `cargo fmt`. Certain things aren't caught by the code formatter, these are described below.

### Blank lines

Blank lines should be used between `mod`, `struct`, `fn`, `impl Trait for Type` and other declarations.

**Rationale:** Without blank lines it becomes harder to spot where a declaration begins and ends.

## Comments

Comments start with a space followed by a sentence which adheres to basic punctuation rules:

```rust
// Your sentence here.
```

When commenting a module, struct, function, etc., consider whether you want the comment to end up in documentation generated by the `cargo doc` command. If so, be sure to add three slashes:

```rust
/// Your sentence here.
```

Prefer writing comments above the line(s) they apply to, not next to them.

**Rationale**: Putting comments next to a line can only be done for very short comments. When the code at any later point in time changes the comment no longer fits. By putting all comments above the line, we will not run into these problems. It is also best for sake of consistency.

Avoid making TODO comments, or comments of any other temporary nature.

**Rationale**: These types of comments tend to stick around and are usually only useful/understandable for the author who wrote the comment. It takes time to read them and they generally lead to confusion. When you have TODOs, please write them down in some other form outside of the code repository.

Avoid keeping commented out code around.

**Rationale**: Commented out is noisy and may cause confusion. Git should be used to track the history and can always be used to retrieve previously committed code.

## Naming

Prefer British English over American English spelling.

**Rationale:** Airbus is a European multinational corporation.

Use long non-abbreviated names for types. E.g. `AuxiliaryPowerUnit` instead of `APU`, `ElectronicControlBox` instead of `ECB`.

**Rationale:** Reduces the need for looking up abbreviations and makes the code base more accessible for developers less familiar with the (sub-)domain.

With names for which the non-abbreviated name has no additional meaning, or when non-abbreviated names are never used in common practice, using the abbreviated name is okay. E.g. `Arinc429Word` instead of `AeronauticalRadioInc429Word`.

**Rationale:** Avoids situations in which too strictly applying the non-abbreviated name rule would result in awkward names.

Use non-abbreviated or abbreviated variable names for variables which refer to types that themselves contain enough information on what it is. E.g. a field of type `AuxiliaryPowerUnit` can be called `auxiliary_power_unit` or `apu`.

**Rationale:** Leaving open this option provides the necessary freedom to write code that "feels right".

Use non-abbreviated variable names for variables which refer to types that are too generic to be understood: e.g. a field of type `Length` should be called `landing_elevation` not `ldg_elev`.

**Rationale:** Reduces the need for looking up abbreviations and makes the code base more accessible for developers less familiar with the (sub-)domain.

An exception to the non-abbreviated variable name rule is mathematical formulae. These are allowed to use short variable names based on the common notation of those formulae.

**Rationale:** Not having this exception would lead to names that feel awkward to those used to working within the mathematical domain.
