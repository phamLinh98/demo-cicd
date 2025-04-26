const path = require("path");
const glob = require("glob");

const entries = Object.fromEntries(
  glob.sync("./src/lambda/**/*.ts").map(relativePath => {
    const parsed = path.parse(relativePath); // ví dụ: { dir: './src/lambda/api', base: 'get-upload-status.ts', ... }
    const folderName = path.basename(parsed.dir); // "api" hoặc "batch"
    const fileName = parsed.name; // "get-upload-status"

    const entryName = `${folderName}-${fileName}`;
    const absolutePath = path.resolve(__dirname, relativePath);

    return [entryName, absolutePath];
  })
);

console.log("🔍 Webpack entries:", entries);

module.exports = {
  mode: process.env.NODE_ENV || "production",
  target: "node18",
  entry: entries,
  resolve: { extensions: [".ts", ".js"] },
  module: {
    rules: [
      { test: /\.ts$/, loader: "ts-loader", exclude: /node_modules/ },
    ],
  },
  output: {
    path: path.resolve(__dirname, "src/build/lambda"),
    filename: "[name].mjs",
    library: { type: "module" },
    module: true,
  },
  experiments: { outputModule: true },
  externalsType: "node-commonjs",
  optimization: {
    minimize: false,
    splitChunks: false,
    runtimeChunk: false,
  },
};