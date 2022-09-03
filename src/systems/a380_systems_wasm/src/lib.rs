use std::error::Error;
use a380_systems::A380;
use systems_wasm::{MsfsSimulationBuilder, Variable};

#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn Error>> {
    let mut sim_connect = gauge.open_simconnect("systems")?;

    println!("bruhh-1");

    let key_prefix = "A380X_";
    let (mut simulation, mut handler) = MsfsSimulationBuilder::new(
        key_prefix,
        Variable::named(&"A32NX_START_STATE"),
        sim_connect.as_mut().get_mut(),
    )
        .build(A380::new)?;

    while let Some(event) = gauge.next_event().await {
        handler.handle(event, &mut simulation, sim_connect.as_mut().get_mut())?;
    }

    Ok(())
}
