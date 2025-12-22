//! x inc
//! This is unlicensed
//!
//! Discovery trait for maximum composability of different discovery structure
//! eg BLE can expose this functionalities for a modular configurability
//! in an orchestrator.

use crate::{
    identity::PeerInfo,
    types::{BoxFutureResponse, BoxStreamResponse},
};

pub enum DiscoveryEvent {
    PeerDiscovered(PeerInfo),
    PeerLost(PeerInfo),
}

pub trait Discovery {
    type Error;
    type DiscoveryEvent;

    fn start_scan(&self) -> BoxFutureResponse<(), Self::Error>;
    fn stop_scan(&self) -> BoxFutureResponse<(), Self::Error>;
    // poll events
    fn poll_events(&mut self) -> BoxStreamResponse<DiscoveryEvent>;
}

pub trait Advertiser {
    type Error;

    fn broadcast(&self) -> BoxFutureResponse<(), Self::Error>;
    fn stop_broadcast(&self) -> BoxFutureResponse<(), Self::Error>;
}

pub trait DiscoveryAdvertiser: Discovery + Advertiser {}
