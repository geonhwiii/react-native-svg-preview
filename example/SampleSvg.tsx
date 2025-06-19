import React from 'react';
import { View } from 'react-native';
import { Svg, Circle, Rect, Path, G } from 'react-native-svg';

const SampleSvg = () => {
  return (
    <View>
      <Svg width="100" height="100" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="25" fill="#007ACC" />
      </Svg>
      
      <Svg width="120" height="80">
        <Rect x="10" y="10" width="100" height="60" fill="#FF6B6B" stroke="#333" strokeWidth="2" />
      </Svg>
      
      <Svg width="150" height="150" viewBox="0 0 150 150">
        <G>
          <Path d="M10,10 L140,10 L75,140 Z" fill="#4ECDC4" stroke="#333" strokeWidth="1" />
          <Circle cx="75" cy="50" r="10" fill="#FFE66D" />
        </G>
      </Svg>
    </View>
  );
};

export default SampleSvg; 