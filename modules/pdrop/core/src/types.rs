use std::{future, pin::Pin, process::Output};

use futures::Stream;

pub type PeerId = &'static str;
pub type BoxFutureResponse<T, E> = Pin<Box<dyn Future<Output = Result<T, E>> + Send + 'static>>;

pub type BoxStreamResponse<T> = Pin<Box<dyn Stream<Item = T>>>;
