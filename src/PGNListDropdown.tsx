import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';

interface PGNItem {
  PGN: number;
  Name: string;
}

const PGNListDropdown: React.FC = () => {
  const [pgnList, setPgnList] = useState<PGNItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/pgn_name.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.every(item => 'PGN' in item && 'Name' in item)) {
          setPgnList(data);
        } else {
          throw new Error('Invalid data structure');
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching PGN data:', err);
        setError(`Failed to load PGN data. Error: ${err.message}`);
        setIsLoading(false);
      });
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(pgnList, {
      keys: ['Name'],
      threshold: 0.2,
      ignoreLocation: true,
    });
  }, [pgnList]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const filteredPgnList = useMemo(() => {
    if (!searchTerm) return pgnList;
    
    const isNumeric = /^\d+$/.test(searchTerm);
    
    if (isNumeric) {
      // For numeric search, filter PGNs that start with the search term
      return pgnList.filter(item => 
        item.PGN.toString().startsWith(searchTerm)
      );
    } else {
      // For text search, use Fuse.js on the Name field
      return fuse.search(searchTerm).map(result => result.item);
    }
  }, [pgnList, searchTerm, fuse]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <span key={index} className="bg-yellow-300">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const highlightNumber = (number: number, highlight: string) => {
    const numberString = number.toString();
    const index = numberString.indexOf(highlight);
    if (index === -1) return numberString;
    
    return (
      <>
        {numberString.slice(0, index)}
        <span className="bg-yellow-300">
          {numberString.slice(index, index + highlight.length)}
        </span>
        {numberString.slice(index + highlight.length)}
      </>
    );
  };

  if (isLoading) {
    return <div className="text-center">Loading PGN data...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">PGN List</h2>
      <div className="relative mb-4">
        <input
          type="text"
          onChange={handleSearchChange}
          value={searchTerm}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Search PGNs"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {filteredPgnList.length > 0 ? (
        <ul className="max-h-64 overflow-y-auto">
          {filteredPgnList.map(({ PGN, Name }) => (
            <li key={`${PGN}-${Name}`} className="py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700">
                {/^\d+$/.test(searchTerm) ? highlightNumber(PGN, searchTerm) : PGN}:
              </span>{' '}
              {highlightText(Name, searchTerm)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500">No results found</div>
      )}
    </div>
  );
};

export default PGNListDropdown;