import React, { useState } from 'react';

const convertWeight = (value, from, to) => {
  if (!value) return '';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '';

  if (from === 'kg' && to === 'lbs') {
    return (numValue * 2.20462).toFixed(1);
  } else if (from === 'lbs' && to === 'kg') {
    return (numValue / 2.20462).toFixed(1);
  }
  return value;
};

const convertHeight = (value, from, to) => {
  if (!value) return '';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '';

  if (from === 'cm' && to === 'ft') {
    const totalInches = numValue / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  } else if (from === 'ft' && to === 'cm') {
    const match = value.match(/([0-9]+)'([0-9]+)"?/);
    if (match) {
      const feet = parseInt(match[1]);
      const inches = parseInt(match[2]);
      return Math.round((feet * 12 + inches) * 2.54);
    }
    return value;
  }
  return value;
};

const UnitConversionInputs = ({
  weight,
  setWeight,
  height,
  setHeight,
  onWeightChange,
  onHeightChange,
  className
}) => {
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [displayWeight, setDisplayWeight] = useState('');
  const [displayHeight, setDisplayHeight] = useState('');

  const handleWeightUnitToggle = () => {
    const newUnit = weightUnit === 'kg' ? 'lbs' : 'kg';
    setDisplayWeight(convertWeight(weight, weightUnit, newUnit));
    setWeightUnit(newUnit);
  };

  const handleHeightUnitToggle = () => {
    const newUnit = heightUnit === 'cm' ? 'ft' : 'cm';
    setDisplayHeight(convertHeight(height, heightUnit, newUnit));
    setHeightUnit(newUnit);
  };

  const handleWeightChange = (e) => {
    const value = e.target.value;
    if (weightUnit === 'kg') {
      setWeight(value);
      onWeightChange?.(value, 'kg');
    } else {
      setDisplayWeight(value);
      const kgValue = convertWeight(value, 'lbs', 'kg');
      onWeightChange?.(kgValue, 'kg', value, 'lbs');
    }
  };

  const handleHeightChange = (e) => {
    const value = e.target.value;
    if (heightUnit === 'cm') {
      setHeight(value);
      onHeightChange?.(value, 'cm');
    } else {
      setDisplayHeight(value);
      const cmValue = convertHeight(value, 'ft', 'cm');
      onHeightChange?.(cmValue, 'cm', value, 'ft');
    }
  };

  const getConvertedValues = () => {
    const weightInKg = weightUnit === 'kg' 
      ? weight 
      : convertWeight(displayWeight, 'lbs', 'kg');
    
    const heightInCm = heightUnit === 'cm' 
      ? height 
      : convertHeight(displayHeight, 'ft', 'cm');

    return {
      weightInKg,
      heightInCm,
      displayWeight: weightUnit === 'lbs' 
        ? displayWeight 
        : convertWeight(weight, 'kg', 'lbs'),
      displayHeight: heightUnit === 'ft' 
        ? displayHeight 
        : convertHeight(height, 'cm', 'ft'),
      weightUnit,
      heightUnit
    };
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* Weight Input */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Weight
          <span className="ml-1 text-xs text-gray-500">({weightUnit})</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={weightUnit === 'kg' ? weight : displayWeight}
            onChange={handleWeightChange}
            className="w-3/5 p-2 border rounded-lg"
            required
          />
          <button
            type="button"
            onClick={handleWeightUnitToggle}
            className="px-3 p-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {weightUnit === 'kg' ? 'lbs' : 'kg'}
          </button>
        </div>
      </div>

      {/* Height Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Height
          <span className="ml-1 text-xs text-gray-500">({heightUnit})</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={heightUnit === 'cm' ? height : displayHeight}
            onChange={handleHeightChange}
            className="w-3/5 p-2 border rounded-lg"
            required
          />
          <button
            type="button"
            onClick={handleHeightUnitToggle}
            className="px-3 p-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {heightUnit === 'cm' ? 'ft/in' : 'cm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { UnitConversionInputs, convertWeight, convertHeight };