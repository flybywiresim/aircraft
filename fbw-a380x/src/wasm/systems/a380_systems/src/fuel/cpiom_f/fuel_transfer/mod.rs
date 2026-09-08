mod cg_transfer;
mod main_transfer;

use super::FuelQuantityProvider;
use crate::fuel::cpiom_f::{TransferGalleryConnections, TransferGalleryTankConnections};
use std::time::Duration;
use uom::si::f64::{Mass, Ratio};

trait FuelTransfer {
    fn set_gallery_modes(
        &self,
        gallery_connections: &mut impl TransferGalleryConnections,
        tank_quantities: &impl FuelQuantityProvider,
    );
}

/// The CPIOM-F partition which calculates how the fuel should get transfered
#[derive(Default)]
pub(super) struct FuelTransferApplication {
    gallery_connections: TransferGalleryTankConnections,

    main_transfer: main_transfer::MainTransfer,
    cg_transfer: cg_transfer::CGTransfer,
}
impl FuelTransferApplication {
    pub(super) fn new() -> Self {
        Self::default()
    }

    pub(super) fn reset(&mut self) {
        *self = Self::new();
    }

    pub(super) fn update(
        &mut self,
        tank_quantities: &impl FuelQuantityProvider,
        total_fuel_on_board: Option<Mass>,
        gross_weight: Option<Mass>,
        gross_cg: Option<Ratio>,
        remaining_flight_time: Option<Duration>,
    ) {
        if total_fuel_on_board.is_none() {
            // Only manual transfers are available
            // TODO
            self.gallery_connections = TransferGalleryTankConnections::default();
            return;
        };

        self.cg_transfer.update(gross_weight, gross_cg);

        self.main_transfer
            .update(tank_quantities, remaining_flight_time);

        let mut gallery_connections = TransferGalleryTankConnections::default();

        self.cg_transfer
            .set_gallery_modes(&mut gallery_connections, tank_quantities);
        self.main_transfer
            .set_gallery_modes(&mut gallery_connections, tank_quantities);

        self.gallery_connections = gallery_connections;
    }

    pub(super) fn gallery_connections(&self) -> &TransferGalleryTankConnections {
        &self.gallery_connections
    }
}
