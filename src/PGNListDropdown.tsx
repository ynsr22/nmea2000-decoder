import React, { useState } from 'react';
import { Search } from 'lucide-react';

const PGNListDropdown: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const pgnList = [
    { pgn: '61184', name: 'Vessel Heading' },
    { pgn: '127250', name: 'Vessel Heading' },
    { pgn: '129025', name: 'Position Rapid Update' },
    { pgn: '129029', name: 'GNSS Position Data' },
    { pgn: '130306', name: 'Wind Data' },
  ];

  const filteredPgnList = pgnList.filter(pgn =>
    pgn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pgn.pgn.includes(searchTerm)
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">PGN List</h2>
      <div className="relative mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Search PGNs"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      <ul className="max-h-64 overflow-y-auto">
        {filteredPgnList.map(({ pgn, name }) => (
          <li key={pgn} className="py-2 border-b border-gray-200">
            <span className="font-medium text-gray-700">{pgn}:</span> {name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PGNListDropdown;
