'use client';
import React from 'react';

// Simplified DotGrid component without GSAP dependencies
const DotGrid = () => {
  return (
    <div className="fixed inset-0 opacity-20 pointer-events-none">
      <div className="absolute inset-0" 
           style={{
             backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }}
      />
    </div>
  );
};

export default DotGrid;
