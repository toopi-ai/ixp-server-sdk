import React from 'react';
import { LocalTheme, localTheme } from '../theme';

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
  theme?: LocalTheme;
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
  onViewDetails,
  theme = localTheme
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

  const cardStyles = {
    ...theme.components.card.base,
    ...theme.components.card.variants.elevated,
    ...theme.components.card.sizes.md,
    maxWidth: '320px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s'
  };

  const buttonStyles = {
    ...theme.components.button.base,
    ...theme.components.button.variants.primary,
    ...theme.components.button.sizes.md,
    width: '100%',
    marginTop: theme.spacing[3]
  };

  return (
    <div className="car-card" style={cardStyles}
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
          margin: `0 0 ${theme.spacing[2]} 0`,
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary
        }}>
          {year} {make} {model}
        </h3>
        
        <div className="car-price" style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.primary[600],
          marginBottom: theme.spacing[3]
        }}>
          {formatPrice(price)}
        </div>
        
        <div className="car-details" style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          lineHeight: theme.typography.lineHeight.relaxed
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
          style={buttonStyles}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, theme.components.button.states.hover);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, buttonStyles);
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
