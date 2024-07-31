import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { debounce } from 'lodash';

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

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  const filteredPgnList = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    return pgnList.filter(item =>
      item.Name.toLowerCase().includes(lowercasedTerm)
    );
  }, [pgnList, searchTerm]);

  const highlightText = (text: string, highlight: string) => {
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
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
              <span className="font-medium text-gray-700">{PGN}:</span>{' '}
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
