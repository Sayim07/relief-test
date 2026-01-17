'use client';

import React from 'react';

const DotGrid = () => {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `radial-gradient(#3b82f6 1px, transparent 0)`,
                    backgroundSize: '40px 40px',
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        </div>
    );
};

export default DotGrid;
