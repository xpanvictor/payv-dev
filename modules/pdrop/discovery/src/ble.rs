use core::types::BoxFutureResponse;

use bluster::Peripheral;
use btleplug::{
    api::{Central, Manager, ScanFilter},
    platform::{self},
};
use uuid::Uuid;

pub struct BleDiscovery {
    manager: btleplug::platform::Manager,
    peripheral: Option<Peripheral>,
}

// error types
pub enum BleDiscoveryError {
    InitializationError(btleplug::Error),
    DiscoveryError(btleplug::Error),
}

pub enum BleAdvertiserError {
    InitializationError(btleplug::Error),
    AdvertiserError(btleplug::Error),
}

impl From<btleplug::Error> for BleDiscoveryError {
    fn from(err: btleplug::Error) -> Self {
        BleDiscoveryError::InitializationError(err)
    }
}

impl BleDiscovery {
    pub async fn new() -> Result<Self, BleDiscoveryError> {
        let manager = platform::Manager::new().await?;
        Ok(BleDiscovery {
            manager,
            peripheral: Peripheral::new().await.ok(),
        })
    }

    pub fn publish_service(&self) -> BoxFutureResponse<(), BleDiscoveryError> {
        Box::pin(async move { Ok(()) })
    }
}

impl core::discovery::Discovery for BleDiscovery {
    type Error = BleDiscoveryError;
    type DiscoveryEvent = core::discovery::DiscoveryEvent;

    fn start_scan(&self) -> BoxFutureResponse<(), Self::Error> {
        let manager = self.manager.clone();
        Box::pin(async move {
            let central = manager
                .adapters()
                .await
                .unwrap()
                .into_iter()
                .nth(0)
                .unwrap();
            central.start_scan(ScanFilter::default()).await.unwrap();
            Ok(())
        })
    }
    fn stop_scan(&self) -> BoxFutureResponse<(), Self::Error> {
        Box::pin(async move { Ok(()) })
    }

    fn poll_events(&mut self) -> core::types::BoxStreamResponse<Self::DiscoveryEvent> {
        Box::pin(futures::stream::empty())
    }
}

impl core::discovery::Advertiser for BleDiscovery {
    type Error = BleAdvertiserError;

    fn broadcast(&self) -> BoxFutureResponse<(), Self::Error> {
        if let Some(peripheral) = &self.peripheral {
            let _ = peripheral.start_advertising("pdrop-01", &[Uuid::from_u128(0x180D)]);
        } else {
            // some log
        }
        Box::pin(async move { Ok(()) })
    }

    fn stop_broadcast(&self) -> BoxFutureResponse<(), Self::Error> {
        Box::pin(async move { Ok(()) })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
}
