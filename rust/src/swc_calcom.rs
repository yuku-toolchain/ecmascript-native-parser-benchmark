#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

fn main() {
    rust_parsers::parse_tsx_with_swc(include_str!("../../files/calcom.tsx"));
}
