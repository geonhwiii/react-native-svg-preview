import React from 'react';
import { View } from 'react-native';
import { Svg, Circle, Rect, Path, G } from 'react-native-svg';

const SampleSvg = () => {
  return (
    <View>
      <Svg width="100" height="100" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="25" fill="#007ACC" />
      </Svg>
    </View>
  );
};

export default SampleSvg; 