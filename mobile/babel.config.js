module.exports = {
  presets: [
    'module:metro-react-native-babel-preset',
  ],
  plugins: [
    '@babel/plugin-transform-private-methods',
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-private-property-in-object'
  ]
}; 