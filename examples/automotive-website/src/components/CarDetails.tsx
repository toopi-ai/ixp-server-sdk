import React, { useState } from 'react';

interface CarSpec {
  label: string;
  value: string;
}

interface CarFeature {
  category: string;
  items: string[];
}

interface CarDetailsProps {
  id?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  color: string;
  engine: string;
  drivetrain: string;
  bodyType: string;
  doors: number;
  seats: number;
  mpgCity?: number;
  mpgHighway?: number;
  vin?: string;
  stockNumber?: string;
  description?: string;
  images?: string[];
  specifications?: CarSpec[];
  features?: CarFeature[];
  dealerName?: string;
  dealerPhone?: string;
  dealerEmail?: string;
  onContactDealer?: () => void;
  onScheduleTest?: () => void;
  onGetFinancing?: () => void;
}

export const CarDetails: React.FC<CarDetailsProps> = ({
  id = 'CAR001',
  make = 'Toyota',
  model = 'Camry',
  year = 2023,
  price = 28500,
  mileage = 15000,
  fuelType = 'Gasoline',
  transmission = 'Automatic',
  color = 'Silver',
  engine = '2.5L 4-Cylinder',
  drivetrain = 'FWD',
  bodyType = 'Sedan',
  doors = 4,
  seats = 5,
  mpgCity = 28,
  mpgHighway = 39,
  vin = '1HGBH41JXMN109186',
  stockNumber = 'TC2023001',
  description = 'This well-maintained Toyota Camry offers excellent fuel economy, reliability, and comfort. Perfect for daily commuting and family trips.',
  images = [
    'https://via.placeholder.com/600x400/4A90E2/FFFFFF?text=Front+View',
    'https://via.placeholder.com/600x400/50C878/FFFFFF?text=Side+View',
    'https://via.placeholder.com/600x400/FF6B6B/FFFFFF?text=Interior',
    'https://via.placeholder.com/600x400/FFD93D/FFFFFF?text=Back+View'
  ],
  specifications = [
    { label: 'Engine', value: '2.5L 4-Cylinder' },
    { label: 'Horsepower', value: '203 hp' },
    { label: 'Torque', value: '184 lb-ft' },
    { label: 'Fuel Tank', value: '15.8 gallons' },
    { label: 'Curb Weight', value: '3,310 lbs' },
    { label: 'Cargo Space', value: '15.1 cu ft' }
  ],
  features = [
    {
      category: 'Safety',
      items: ['Toyota Safety Sense 2.0', 'Blind Spot Monitor', 'Rear Cross Traffic Alert', '10 Airbags']
    },
    {
      category: 'Technology',
      items: ['8-inch Touchscreen', 'Apple CarPlay', 'Android Auto', 'Wireless Charging']
    },
    {
      category: 'Comfort',
      items: ['Dual-Zone Climate Control', 'Heated Seats', 'Power Driver Seat', 'Keyless Entry']
    }
  ],
  dealerName = 'Premium Auto Sales',
  dealerPhone = '(555) 123-4567',
  dealerEmail = 'sales@premiumauto.com',
  onContactDealer,
  onScheduleTest,
  onGetFinancing
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllSpecs, setShowAllSpecs] = useState(false);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatMileage = (mileage: number): string => {
    return new Intl.NumberFormat('en-US').format(mileage);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s ease'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    color: 'white'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db'
  };

  return (
    <div className="car-details" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '30px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '20px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#111827',
          margin: '0 0 8px 0'
        }}>
          {year} {make} {model}
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <span style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#059669'
          }}>
            {formatPrice(price)}
          </span>
          <span style={{
            fontSize: '16px',
            color: '#6b7280'
          }}>
            {formatMileage(mileage)} miles
          </span>
          <span style={{
            fontSize: '16px',
            color: '#6b7280'
          }}>
            Stock #{stockNumber}
          </span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '30px',
        alignItems: 'start'
      }}>
        {/* Left Column - Images and Details */}
        <div>
          {/* Image Gallery */}
          <div style={{
            marginBottom: '30px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'relative',
              height: '400px',
              backgroundColor: '#e5e7eb'
            }}>
              <img
                src={images[currentImageIndex]}
                alt={`${make} ${model} - Image ${currentImageIndex + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '15px',
              overflowX: 'auto'
            }}>
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    width: '80px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: currentImageIndex === index ? '2px solid #2563eb' : '2px solid transparent',
                    opacity: currentImageIndex === index ? 1 : 0.7
                  }}
                />
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: '#111827'
            }}>
              Vehicle Information
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <div><strong>Body Type:</strong> {bodyType}</div>
              <div><strong>Engine:</strong> {engine}</div>
              <div><strong>Transmission:</strong> {transmission}</div>
              <div><strong>Drivetrain:</strong> {drivetrain}</div>
              <div><strong>Fuel Type:</strong> {fuelType}</div>
              <div><strong>Color:</strong> {color}</div>
              <div><strong>Doors:</strong> {doors}</div>
              <div><strong>Seats:</strong> {seats}</div>
              {mpgCity && mpgHighway && (
                <div><strong>MPG:</strong> {mpgCity} city / {mpgHighway} highway</div>
              )}
              {vin && <div><strong>VIN:</strong> {vin}</div>}
            </div>
          </div>

          {/* Description */}
          {description && (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '15px',
                color: '#111827'
              }}>
                Description
              </h3>
              <p style={{
                lineHeight: '1.6',
                color: '#374151',
                margin: 0
              }}>
                {description}
              </p>
            </div>
          )}

          {/* Specifications */}
          {specifications && specifications.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: 0
                }}>
                  Specifications
                </h3>
                <button
                  onClick={() => setShowAllSpecs(!showAllSpecs)}
                  style={{
                    ...secondaryButtonStyle,
                    padding: '6px 12px',
                    fontSize: '14px'
                  }}
                >
                  {showAllSpecs ? 'Show Less' : 'Show All'}
                </button>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '8px'
              }}>
                {(showAllSpecs ? specifications : specifications.slice(0, 4)).map((spec, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <span style={{ fontWeight: '500' }}>{spec.label}:</span>
                    <span style={{ color: '#6b7280' }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {features && features.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '15px',
                color: '#111827'
              }}>
                Features
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                {features.map((feature, index) => (
                  <div key={index}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: '#374151'
                    }}>
                      {feature.category}
                    </h4>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0
                    }}>
                      {feature.items.map((item, itemIndex) => (
                        <li key={itemIndex} style={{
                          padding: '4px 0',
                          color: '#6b7280',
                          fontSize: '14px'
                        }}>
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Contact Info */}
        <div style={{
          position: 'sticky',
          top: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '25px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#111827'
            }}>
              Contact Dealer
            </h3>
            
            {dealerName && (
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#374151' }}>{dealerName}</strong>
              </div>
            )}
            
            {dealerPhone && (
              <div style={{ marginBottom: '10px', color: '#6b7280' }}>
                📞 {dealerPhone}
              </div>
            )}
            
            {dealerEmail && (
              <div style={{ marginBottom: '20px', color: '#6b7280' }}>
                ✉️ {dealerEmail}
              </div>
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <button
                onClick={onContactDealer}
                style={primaryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
              >
                Contact Dealer
              </button>
              
              <button
                onClick={onScheduleTest}
                style={secondaryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                Schedule Test Drive
              </button>
              
              <button
                onClick={onGetFinancing}
                style={secondaryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                Get Financing
              </button>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f0f9ff',
              borderRadius: '6px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#0369a1',
                textAlign: 'center'
              }}>
                💰 <strong>Special Offer</strong><br/>
                Get pre-approved financing<br/>
                with rates as low as 2.9% APR
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
