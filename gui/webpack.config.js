module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: "./renderer/index.tsx",
  output: {
    path: `${__dirname}/dist`,
    filename: "renderer.js",
    publicPath: "/dist"
  },
  devServer: {
    hot: true,
    contentBase: ".",
    watchContentBase: true,
    inline: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  target: ["web", "es5"],
};
