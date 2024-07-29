import React from 'react'
import ReactDOM from 'react-dom/client'
import NMEA2000Decoder from './App.tsx'
import PGNListDropdown from './PGNListDropdown';
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row md:space-x-8 w-full max-w-6xl">
        <div className="flex-grow md:w-2/3">
          <NMEA2000Decoder />
        </div>
        <div className="md:w-1/3 mt-8 md:mt-8 mx-auto">
          <PGNListDropdown />
        </div>
      </div>
    </div>
  </React.StrictMode>,
)
