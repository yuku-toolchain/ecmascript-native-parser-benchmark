const std = @import("std");
const yuku_parser = @import("yuku_parser");
const config = @import("config");

const source = @embedFile("source");

pub fn main(_: std.process.Init) !void {
    const tree = try yuku_parser.parse(std.heap.page_allocator, source, .{
        .lang = comptime .fromPath(config.source_path),
        .source_type = comptime .fromPath(config.source_path),
    });
    defer tree.deinit();
}
