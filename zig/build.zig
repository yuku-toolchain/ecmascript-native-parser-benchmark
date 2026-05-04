const std = @import("std");

const files = .{
    .{ .name = "typescript", .path = "../files/typescript.js" },
    .{ .name = "calcom", .path = "../files/calcom.tsx" },
    .{ .name = "react", .path = "../files/react.js" },
};

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const yuku_dep = b.dependency("yuku", .{
        .target = target,
        .optimize = optimize,
    });

    const yuku_parser = yuku_dep.module("parser");

    inline for (files) |file| {
        const opts = b.addOptions();
        opts.addOption([]const u8, "source_path", file.path);

        const yuku_exe = b.addExecutable(.{
            .name = "yuku_" ++ file.name,
            .root_module = b.createModule(.{
                .root_source_file = b.path("src/yuku.zig"),
                .target = target,
                .optimize = optimize,
            }),
        });
        yuku_exe.root_module.addImport("yuku_parser", yuku_parser);
        yuku_exe.root_module.addAnonymousImport("source", .{
            .root_source_file = b.path(file.path),
        });
        yuku_exe.root_module.addOptions("config", opts);
        b.installArtifact(yuku_exe);

        const yuku_semantic_exe = b.addExecutable(.{
            .name = "yuku_semantic_" ++ file.name,
            .root_module = b.createModule(.{
                .root_source_file = b.path("src/yuku_semantic.zig"),
                .target = target,
                .optimize = optimize,
            }),
        });
        yuku_semantic_exe.root_module.addImport("yuku_parser", yuku_parser);
        yuku_semantic_exe.root_module.addAnonymousImport("source", .{
            .root_source_file = b.path(file.path),
        });
        yuku_semantic_exe.root_module.addOptions("config", opts);
        b.installArtifact(yuku_semantic_exe);

    }
}
