import React from 'react';

interface ExteriorProps {
  // Define your props here
}

const Exterior: React.FC<ExteriorProps> = (props) => {
  return (
    <div className="exterior-container">
      <h2>Exterior</h2>
      <p>This is a new Exterior component.</p>
    </div>
  );
};

export default Exterior;
