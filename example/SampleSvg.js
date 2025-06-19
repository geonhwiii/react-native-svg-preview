"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_svg_1 = require("react-native-svg");
const SampleSvg = () => {
    return (<react_native_1.View>
      <react_native_svg_1.Svg width="100" height="100" viewBox="0 0 100 100">
        <react_native_svg_1.Circle cx="50" cy="50" r="25" fill="#007ACC"/>
      </react_native_svg_1.Svg>
      
      <react_native_svg_1.Svg width="120" height="80">
        <react_native_svg_1.Rect x="10" y="10" width="100" height="60" fill="#FF6B6B" stroke="#333" strokeWidth="2"/>
      </react_native_svg_1.Svg>
      
      <react_native_svg_1.Svg width="150" height="150" viewBox="0 0 150 150">
        <react_native_svg_1.G>
          <react_native_svg_1.Path d="M10,10 L140,10 L75,140 Z" fill="#4ECDC4" stroke="#333" strokeWidth="1"/>
          <react_native_svg_1.Circle cx="75" cy="50" r="10" fill="#FFE66D"/>
        </react_native_svg_1.G>
      </react_native_svg_1.Svg>
    </react_native_1.View>);
};
exports.default = SampleSvg;
//# sourceMappingURL=SampleSvg.js.map