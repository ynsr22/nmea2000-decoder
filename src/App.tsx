import React, { useState, useEffect } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Tooltip } from 'react-tooltip';

interface PGNField {
  name: string;
  start: number;
  length: number;
  units: string;
}

interface PGNInfo {
  name: string;
  fields: PGNField[];
}

const PGN_DATA: Record<string, PGNInfo> = {
  '127508': {
    name: 'Vessel Heading',
    fields: [
      { name: 'SID', start: 0, length: 1, units: '' },
      { name: 'Heading', start: 1, length: 2, units: 'rad' },
      { name: 'Deviation', start: 3, length: 2, units: 'rad' },
      { name: 'Variation', start: 5, length: 2, units: 'rad' },
      { name: 'Reference', start: 7, length: 1, units: '' },
    ],
  },
};

const hexToBinary = (hex: string): string => {
  return hex
    .split('')
    .map((char) => {
      const value = parseInt(char, 16);
      if (isNaN(value)) {
        throw new Error('Invalid character in hex string');
      }
      return value.toString(2).padStart(4, '0');
    })
    .join('');
};

const binaryToDecimal = (binary: string): number => {
  return parseInt(binary, 2);
};

interface DecodedCanMessage {
  priority: number;
  pgn: number;
  srcAddress: number;
  destAddress: number;
  pduFormat: string;
}

const decodeCanMessage = (hexInput: string): DecodedCanMessage => {
  if (hexInput.length !== 8) {
    throw new Error('Input hex string must be exactly 8 characters long.');
  }

  const binary = hexToBinary(hexInput).substring(3);

  if (binary.length !== 29) {
    throw new Error('Converted binary string must be 29 bits long.');
  }

  const priority = binaryToDecimal(binary.substring(0, 3));
  const pdu = binaryToDecimal(binary.substring(5, 13));
  const pds = binary.substring(13, 21);
  const srcAddress = binaryToDecimal(binary.substring(21, 29));

  let pduFormat: string;
  let pgn: number;
  let destAddress: number;

  if (pdu >= 240) {
    pduFormat = 'PDU2';
    pgn = binaryToDecimal(binary.substring(3, 21));
    destAddress = 255;
  } else {
    pduFormat = 'PDU1';
    pgn = binaryToDecimal(binary.substring(3, 13) + '00000000');
    destAddress = binaryToDecimal(pds);
  }

  return { priority, pgn, srcAddress, destAddress, pduFormat };
};

const NMEA2000Decoder: React.FC = () => {
  const [idInput, setIdInput] = useState('19F21451');
  const [decodedId, setDecodedId] = useState<DecodedCanMessage | null>(null);
  const [dataInput, setDataInput] = useState('00123456789ABCDE');
  const [decodedData, setDecodedData] = useState<Record<string, string>>({});
  const [idError, setIdError] = useState('');
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    try {
      const decoded = decodeCanMessage(idInput);
      setDecodedId(decoded);
      setIdError('');
    } catch (e) {
      setDecodedId(null);
      setIdError((e as Error).message);
      setDecodedData({});
    }
  }, [idInput]);

  useEffect(() => {
    if (decodedId && decodedId.pgn) {
      decodeData(dataInput, decodedId.pgn);
    }
  }, [decodedId, dataInput]);

  const decodeData = (data: string, pgn: number) => {
    if (data.length !== 16) {
      setDecodedData({});
      setDataError('Data must be 8 bytes (16 hex characters)');
      return;
    }
    const pgnInfo = PGN_DATA[pgn];
    if (!pgnInfo) {
      setDecodedData({});
      setDataError('Unknown PGN');
      return;
    }
    const decodedFields: Record<string, string> = {};
    pgnInfo.fields.forEach((field) => {
      const startByte = field.start * 2;
      const endByte = startByte + field.length * 2;
      let value = parseInt(data.slice(startByte, endByte), 16);

      if (field.units === 'rad') {
        value = parseFloat((value * 0.0001).toFixed(4));
      }

      decodedFields[field.name] = value.toString();
    });
    setDecodedData(decodedFields);
    setDataError('');
  };

  const handleIdInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdInput(e.target.value);
  };

  const handleDataInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataInput(e.target.value);
  };

  return (
    <div className="min-h-screen flex justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">NMEA 2000 Protocol Decoder</h1>
        <div className="space-y-6">
          <div>
            <label htmlFor="idInput" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
              Message ID (4 bytes)
              <a data-tooltip-id="my-tooltip" data-tooltip-content="ID Input HERE" data-tooltip-place="right">
                <Info className="ml-1 h-4 w-4 text-gray-400" />
              </a>
              <Tooltip id="my-tooltip" />
            </label>
            <input
              id="idInput"
              type="text"
              value={idInput}
              onChange={handleIdInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter 8 hex characters"
            />
            {idError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{idError}</AlertDescription>
              </Alert>
            )}
          </div>
          {decodedId && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(decodedId).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                  <input
                    type="text"
                    value={value.toString()}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
                  />
                </div>
              ))}
            </div>
          )}
          <div>
            <label htmlFor="dataInput" className="flex text-sm font-medium text-gray-700 mb-1 items-center">
              Data (8 bytes)
              <a data-tooltip-id="my-tooltip2" data-tooltip-content="Enter 16 hex characters representing the Data" data-tooltip-place="right">
                <Info className="ml-1 h-4 w-4 text-gray-400" />
              </a>
              <Tooltip id="my-tooltip2" />
            </label>
            <input
              id="dataInput"
              type="text"
              value={dataInput}
              onChange={handleDataInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter 16 hex characters"
            />
            {dataError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{dataError}</AlertDescription>
              </Alert>
            )}
          </div>
          {Object.keys(decodedData).length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(decodedData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                  <input
                    type="text"
                    value={value}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NMEA2000Decoder;
