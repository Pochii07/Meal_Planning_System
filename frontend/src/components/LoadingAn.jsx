import React from 'react';
import { bouncy } from 'ldrs';

bouncy.register()

const loadingAn = ({ size = 20, color = '#FEFEFA', speed = 1.75 }) => {
  return (
    <bouncy
      size={size}
      speed={speed}
      color={color}
    ></bouncy>
  );
};


export default  loadingAn;
