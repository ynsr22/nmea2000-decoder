// Import necessary React hooks and other dependencies
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { debounce } from 'lodash';

// Define the type for the PGN item
type PGNItem = { PGN: number; Name: string };

// Define the PGNListDropdown component
const PGNListDropdown: React.FC = () => {
  // Initialize state variables
  const [pgnList, setPgnList] = useState<PGNItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect hook to fetch data and handle caching
  useEffect(() => {
    const cachedData = localStorage.getItem('pgnListCache');
    if (cachedData) {
      setPgnList(JSON.parse(cachedData));
      setLoading(false);
    } else {
      fetch('/pgn_name.json')
        .then(response => response.json())
        .then(data => {
          // Validate data structure
          if (Array.isArray(data) && data.every(item => 'PGN' in item && 'Name' in item)) {
            setPgnList(data);
            localStorage.setItem('pgnListCache', JSON.stringify(data));
          } else {
            throw new Error('Invalid data structure');
          }
          setLoading(false);
        })
        .catch(err => {
          setError(`Failed to load PGN data. Error: ${err.message}`);
          setLoading(false);
        });
    }
  }, []);

  // useMemo hook to initialize Fuse.js for fuzzy searching
  const fuse = useMemo(() => new Fuse(pgnList, {
    keys: ['Name'],
    threshold: 0.2,
    ignoreLocation: true,
  }), [pgnList]);

  // useCallback hook to handle search input change with debouncing
  const handleSearchChange = useCallback(debounce((e: React.ChangeEvent<HTMLInputElement>) => 
    setSearchTerm(e.target.value), 300), []);

  // useMemo hook to filter the PGN list based on the search term
  const filteredPgnList = useMemo(() => {
    if (!searchTerm) return pgnList;
    return /^\d+$/.test(searchTerm)
      ? pgnList.filter(item => item.PGN.toString().startsWith(searchTerm))
      : fuse.search(searchTerm).map(result => result.item);
  }, [pgnList, searchTerm, fuse]);

  // Function to highlight the search term in the text
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 w-full md:w-80">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">PGN List</h2>
      <div className="relative mb-4">
        <input
          type="text"
          onChange={handleSearchChange}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Search PGNs"
        />
        <Search className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
      </div>
      {loading ? (
        // Display a skeleton loader while data is loading
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : error ? (
        // Display an error message if data fetching fails
        <div className="text-center text-red-500">{error}</div>
      ) : filteredPgnList.length ? (
        // Display the filtered PGN list
        <div className="max-h-96 overflow-y-auto">
          {filteredPgnList.map(({ PGN, Name }, index) => (
            <div key={index} className="py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700">{highlightText(PGN.toString(), searchTerm)}:</span> {highlightText(Name, searchTerm)}
            </div>
          ))}
        </div>
      ) : (
        // Display a message if no results are found
        <div className="text-center text-gray-500">No results found</div>
      )}
    </div>
  );
};

// Export the component as the default export
export default PGNListDropdown;
