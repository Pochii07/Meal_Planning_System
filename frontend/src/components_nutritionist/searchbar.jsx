import { useState, useEffect } from 'react';

export const BMI_CATEGORIES = [
  { label: 'Underweight', range: [0, 18.4] },
  { label: 'Normal', range: [18.5, 22.9] },
  { label: 'Overweight', range: [23, 24.99] },
  { label: 'Obese I', range: [25, 29.9] },
  { label: 'Obese II', range: [30, Infinity] }
];

const PatientSearchBar = ({ onSearchChange }) => {
  const [filterType, setFilterType] = useState('name');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const initialSearch = '';
    const initialFilter = 'name';
    onSearchChange?.(initialSearch, initialFilter);
  }, []);

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    if (onSearchChange) {
      onSearchChange(e.target.value, filterType);
    }
  };

  const handleFilterChange = (type) => {
    setSearchText('');
    setFilterType(type);
    onSearchChange('', type);
  };

  const selectClass = `w-full h-[45px] px-2.5 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${searchText === '' ? 'text-gray-500' : ''}`
  return (
    <div className="flex gap-2 mb-4">
      <div className="flex items-center gap-2 flex-1">
        {filterType === 'bmi' ? (
            <select
            value={searchText}
            onChange={handleSearchChange}
            className={selectClass}
            >
            <option className='hidden' value="">Select BMI category...</option>
            {BMI_CATEGORIES.map((category) => (
                <option className='text-gray-800' key={category.label} value={category.label}>
                    {category.label} ({category.range[0]}-{category.range[1] === Infinity ? '∞' : category.range[1]})
                </option>
            ))}
            </select>
        ) : (
            <input
            type={filterType === 'name' ? 'text' : 'number'}
            value={searchText}
            onChange={handleSearchChange}
            placeholder={
                filterType === 'name' ? 'Search patients by first or last name...' : 
                'Search patients by age...'
            }
            className={`w-full h-[45px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                filterType !== 'name' ? 
                '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : 
                ''
            }`}
            />
        )}
      </div>
      <div className="flex py-2.5 gap-1">
        <button
          onClick={() => handleFilterChange('name')}
          className={`h-[45px] px-4 py-2 rounded-lg ${
            filterType === 'name' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Name
        </button>
        <button
          onClick={() => handleFilterChange('age')}
          className={`h-[45px] px-4 py-2 rounded-lg ${
            filterType === 'age' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Age
        </button>
        <button
          onClick={() => handleFilterChange('bmi')}
          className={`h-[45px] px-4 py-2 rounded-lg ${
            filterType === 'bmi' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          BMI
        </button>
      </div>
      
    </div>
  );
};

export default PatientSearchBar;