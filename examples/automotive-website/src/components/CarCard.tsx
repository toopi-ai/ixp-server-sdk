import React from 'react';

interface CarCardProps {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  imageUrl?: string;
  onViewDetails?: () => void;
}

export const CarCard: React.FC<CarCardProps> = ({
  make,
  model,
  year,
  price,
  mileage,
  fuelType = 'Gasoline',
  transmission = 'Automatic',
  color = 'Black',
  imageUrl = 'https://via.placeholder.com/300x200?text=Car+Image',
  onViewDetails
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage?: number) => {
    if (!mileage) return 'N/A';
    return new Intl.NumberFormat('en-US').format(mileage) + ' miles';
  };

  return (
    <div className="car-card" style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '16px',
      margin: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: '320px',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }}
    onClick={onViewDetails}
    >
      <img 
        src={imageUrl} 
        alt={`${year} ${make} ${model}`}
        style={{
          width: '100%',
          height: '180px',
          objectFit: 'cover',
          borderRadius: '4px',
          marginBottom: '12px'
        }}
      />
      
      <div className="car-info">
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          {year} {make} {model}
        </h3>
        
        <div className="car-price" style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#2563eb',
          marginBottom: '12px'
        }}>
          {formatPrice(price)}
        </div>
        
        <div className="car-details" style={{
          fontSize: '14px',
          color: '#666',
          lineHeight: '1.4'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Mileage:</strong> {formatMileage(mileage)}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Fuel:</strong> {fuelType}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Transmission:</strong> {transmission}
          </div>
          <div>
            <strong>Color:</strong> {color}
          </div>
        </div>
        
        <button 
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.();
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
};
