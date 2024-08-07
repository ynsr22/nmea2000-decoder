import React from 'react';
import NMEA2000Decoder from './NMEA2000decoder';
import PGNListDropdown from './PGNListDropdown';
import './App.css';
import { Analytics } from '@vercel/analytics/react';

const App = () => (
  <React.StrictMode>
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-red-400 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row md:space-x-8 max-w-6xl">
        <div className="flex-grow md:w-2/3">
          <NMEA2000Decoder />
        </div>
        <div className="md:w-1/3 mt-5 md:mt-0 mx-auto w-full">
          <PGNListDropdown />
        </div>
      </div>
    </div>
    <Analytics />
  </React.StrictMode>
);

export default App;