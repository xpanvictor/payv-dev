use core::types::BoxFutureResponse;

use async_trait::async_trait;
use btleplug::{
    api::{Central, Manager, ScanFilter},
    platform::{self},
};

pub struct BleDiscovery {
    manager: btleplug::platform::Manager,
}

// error types
pub enum BleDiscoveryError {
    InitializationError(btleplug::Error),
    DiscoveryError(btleplug::Error),
}

impl From<btleplug::Error> for BleDiscoveryError {
    fn from(err: btleplug::Error) -> Self {
        BleDiscoveryError::InitializationError(err)
    }
}

impl BleDiscovery {
    pub async fn new() -> Result<Self, BleDiscoveryError> {
        let manager = platform::Manager::new().await?;
        Ok(BleDiscovery { manager })
    }
}

impl core::discovery::Discovery for BleDiscovery {
    type Error = BleDiscoveryError;

    fn start(&self) -> BoxFutureResponse<(), Self::Error> {
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
    fn stop(&self) -> BoxFutureResponse<(), Self::Error> {
        Box::pin(async move { Ok(()) })
    }
    fn on_peer_discovered(&self, callback: impl Fn(core::identity::PeerInfo)) {}
}

#[cfg(test)]
mod tests {
    use super::*;
}
