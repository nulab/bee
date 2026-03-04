import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["./src/index"],
  hooks: {
    "rollup:options": (ctx, _options) => {
      // Remove workspace packages from externals so they get bundled.
      // unbuild's inferPkgExternals() adds all `dependencies` to the externals
      // list, and the external() function checks this list BEFORE checking
      // inlineDependencies. Workspace packages export raw .ts source which
      // Node.js ESM cannot resolve, so they must be inlined into the bundle.
      ctx.options.externals = ctx.options.externals.filter((ext) =>
        typeof ext === "string" ? !ext.startsWith("@repo/") : true,
      );
    },
  },
  rollup: {
    inlineDependencies: true,
  },
});
