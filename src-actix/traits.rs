pub trait FromNumber: Sized {
	fn from_number(n: i64) -> Option<Self>;
}