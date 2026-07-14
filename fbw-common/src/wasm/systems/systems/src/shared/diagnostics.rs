use std::cell::RefCell;

use rustc_hash::FxHashSet;

type OptionalFunction = Option<Box<dyn Fn(&str) + 'static>>;
type MutableOptionalFunction = RefCell<OptionalFunction>;

thread_local! {

    // log context and value pairs of unexpected values to avoid flooding the log
    static LOGGED_UNEXPECTED_DISCRETES: RefCell<FxHashSet<(&'static str, u64)>> =
        RefCell::new(FxHashSet::default());


    // as this sits in the sim agnostic module the msfs layer can register the commbus reporter here
    static DIAGNOSTICS_REPORTER: MutableOptionalFunction = const { RefCell::new(None) };
}

pub fn set_diagnostics_reporter(reporter: impl Fn(&str) + 'static) {
    DIAGNOSTICS_REPORTER.with(|r| *r.borrow_mut() = Some(Box::new(reporter)));
}

fn report_diagnostic(message: &str) {
    DIAGNOSTICS_REPORTER.with(|reporter: &MutableOptionalFunction| {
        match reporter.borrow().as_ref() {
            Some(reporter) => reporter(message),
            None => println!("{message}"),
        }
    });
}

pub fn fallback_on_unexpected_discrete<T: std::fmt::Debug>(
    context: &'static str,
    value: u64,
    fallback: T,
) -> T {
    let first_report =
        LOGGED_UNEXPECTED_DISCRETES.with(|logged| logged.borrow_mut().insert((context, value)));
    if first_report {
        report_diagnostic(&format!(
            "unexpected {context} discrete value {value}; falling back to {fallback:?}."
        ));
    }
    fallback
}
