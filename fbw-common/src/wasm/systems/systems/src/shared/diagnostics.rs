use std::{cell::RefCell, sync::OnceLock};

use rustc_hash::FxHashSet;

type DiagnosisReporter = fn(&str);

static DIAGNOSTICS_REPORTER: OnceLock<DiagnosisReporter> = OnceLock::new();

pub fn set_diagnostics_reporter(reporter: DiagnosisReporter) {
    if DIAGNOSTICS_REPORTER.set(reporter).is_err() {
        println!("WARNING: diagnostics reporter already set, ignoring");
    }
}

pub fn report_diagnostic(message: &str) {
    match DIAGNOSTICS_REPORTER.get() {
        Some(reporter) => reporter(message),
        None => println!("{message}"),
    }
}

pub fn fallback_on_unexpected_discrete<T: std::fmt::Debug>(
    context: &'static str,
    value: u64,
    fallback: T,
) -> T {
    thread_local! {
        // log context and value pairs of unexpected values to avoid flooding the log
        static LOGGED_UNEXPECTED_DISCRETES: RefCell<FxHashSet<(&'static str, u64)>> =
            RefCell::new(FxHashSet::default());
    }
    let first_report =
        LOGGED_UNEXPECTED_DISCRETES.with(|logged| logged.borrow_mut().insert((context, value)));
    if first_report {
        report_diagnostic(&format!(
            "unexpected {context} discrete value {value}; falling back to {fallback:?}."
        ));
    }
    fallback
}
