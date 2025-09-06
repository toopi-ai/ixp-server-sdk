import React, { useState } from 'react';

interface FilterValues {
  make: string;
  model: string;
  yearMin: number;
  yearMax: number;
  priceMin: number;
  priceMax: number;
  mileageMax: number;
  fuelType: string;
  transmission: string;
  color: string;
}

interface SearchFiltersProps {
  onFiltersChange?: (filters: FilterValues) => void;
  onSearch?: () => void;
  onReset?: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  onFiltersChange,
  onSearch,
  onReset
}) => {
  const [filters, setFilters] = useState<FilterValues>({
    make: '',
    model: '',
    yearMin: 2000,
    yearMax: new Date().getFullYear(),
    priceMin: 0,
    priceMax: 100000,
    mileageMax: 200000,
    fuelType: '',
    transmission: '',
    color: ''
  });

  const carMakes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz',
    'Audi', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia', 'Mazda',
    'Subaru', 'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Buick'
  ];

  const fuelTypes = ['Gasoline', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid'];
  const transmissions = ['Manual', 'Automatic', 'CVT'];
  const colors = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Other'];

  const handleFilterChange = (key: keyof FilterValues, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      make: '',
      model: '',
      yearMin: 2000,
      yearMax: new Date().getFullYear(),
      priceMin: 0,
      priceMax: 100000,
      mileageMax: 200000,
      fuelType: '',
      transmission: '',
      color: ''
    };
    setFilters(resetFilters);
    onFiltersChange?.(resetFilters);
    onReset?.();
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: '#fff'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  };

  const sectionStyle = {
    marginBottom: '16px'
  };

  return (
    <div className="search-filters" style={{
      backgroundColor: '#f9fafb',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      maxWidth: '300px'
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#111827'
      }}>
        Search Filters
      </h3>

      <div style={sectionStyle}>
        <label style={labelStyle}>Make</label>
        <select
          value={filters.make}
          onChange={(e) => handleFilterChange('make', e.target.value)}
          style={inputStyle}
        >
          <option value="">All Makes</option>
          {carMakes.map(make => (
            <option key={make} value={make}>{make}</option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Model</label>
        <input
          type="text"
          placeholder="Enter model"
          value={filters.model}
          onChange={(e) => handleFilterChange('model', e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Year Range</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            placeholder="Min"
            value={filters.yearMin}
            onChange={(e) => handleFilterChange('yearMin', parseInt(e.target.value) || 2000)}
            style={{ ...inputStyle, width: '48%' }}
            min="1990"
            max={new Date().getFullYear()}
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.yearMax}
            onChange={(e) => handleFilterChange('yearMax', parseInt(e.target.value) || new Date().getFullYear())}
            style={{ ...inputStyle, width: '48%' }}
            min="1990"
            max={new Date().getFullYear()}
          />
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Price Range ($)</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => handleFilterChange('priceMin', parseInt(e.target.value) || 0)}
            style={{ ...inputStyle, width: '48%' }}
            min="0"
            step="1000"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => handleFilterChange('priceMax', parseInt(e.target.value) || 100000)}
            style={{ ...inputStyle, width: '48%' }}
            min="0"
            step="1000"
          />
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Max Mileage</label>
        <input
          type="number"
          placeholder="Maximum mileage"
          value={filters.mileageMax}
          onChange={(e) => handleFilterChange('mileageMax', parseInt(e.target.value) || 200000)}
          style={inputStyle}
          min="0"
          step="5000"
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Fuel Type</label>
        <select
          value={filters.fuelType}
          onChange={(e) => handleFilterChange('fuelType', e.target.value)}
          style={inputStyle}
        >
          <option value="">All Fuel Types</option>
          {fuelTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Transmission</label>
        <select
          value={filters.transmission}
          onChange={(e) => handleFilterChange('transmission', e.target.value)}
          style={inputStyle}
        >
          <option value="">All Transmissions</option>
          {transmissions.map(trans => (
            <option key={trans} value={trans}>{trans}</option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Color</label>
        <select
          value={filters.color}
          onChange={(e) => handleFilterChange('color', e.target.value)}
          style={inputStyle}
        >
          <option value="">All Colors</option>
          {colors.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        <button
          onClick={onSearch}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
        >
          Search
        </button>
        <button
          onClick={handleReset}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6b7280';
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};
