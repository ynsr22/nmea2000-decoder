import React, { useState, useCallback, useMemo } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertTitle } from './components/ui/alert';
import { Tooltip } from 'react-tooltip';

type PGNField = {
  name: string;
  start: number;
  length: number;
  units: string;
};

type PGNInfo = {
  name: string;
  fields: PGNField[];
};

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

interface DecodedCAN {
  priority: number;
  pgn: number;
  srcAddress: number;
  destAddress: number;
  pduFormat: 'PDU1' | 'PDU2';
}

const decodeCanMessage = (hexInput: string): DecodedCAN => {
  if (hexInput.length !== 8) throw new Error('Input hex string must be exactly 8 characters long.');
  const num = parseInt(hexInput, 16);
  const priority = (num >> 26) & 0x7;
  const pdu = (num >> 16) & 0xFF;
  const srcAddress = num & 0xFF;
  const pduFormat = pdu >= 240 ? 'PDU2' : 'PDU1';
  const pgn = pdu >= 240 ? ((num >> 8) & 0x3FFFF) : ((num >> 16) & 0xFF00);
  const destAddress = pdu >= 240 ? 255 : (num >> 8) & 0xFF;
  return { priority, pgn, srcAddress, destAddress, pduFormat };
};

const useCanDecoder = () => {
  const [idInput, setIdInput] = useState('');
  const [dataInput, setDataInput] = useState('');
  const [decodedId, setDecodedId] = useState<DecodedCAN | null>(null);
  const [decodedData, setDecodedData] = useState<Record<string, string>>({});
  const [idError, setIdError] = useState('');
  const [dataError, setDataError] = useState('');

  const decodeId = useCallback((input: string): DecodedCAN | null => {
    try {
      const decoded = decodeCanMessage(input);
      setDecodedId(decoded);
      setIdError('');
      return decoded;
    } catch (e) {
      setDecodedId(null);
      setIdError((e as Error).message);
      setDecodedData({});
      return null;
    }
  }, []);

  const decodeData = useCallback((data: string, pgn: number) => {
    if (data.length !== 16) {
      setDecodedData({});
      setDataError('Data must be 8 bytes (16 hex characters)');
      return;
    }
    const pgnInfo = PGN_DATA[pgn.toString()];
    if (!pgnInfo) {
      setDecodedData({});
      setDataError('Unknown PGN');
      return;
    }
    const decodedFields = pgnInfo.fields.reduce<Record<string, string>>((acc, field) => {
      const startByte = field.start * 2;
      const endByte = startByte + field.length * 2;
      let value = parseInt(data.slice(startByte, endByte), 16);
      if (field.units === 'rad') value = parseFloat((value * 0.0001).toFixed(4));
      acc[field.name] = value.toString();
      return acc;
    }, {});
    setDecodedData(decodedFields);
    setDataError('');
  }, []);

  const handleIdInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setIdInput(input);
    const decoded = decodeId(input);
    if (decoded?.pgn) decodeData(dataInput, decoded.pgn);
  }, [dataInput, decodeId, decodeData]);

  const handleDataInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDataInput(input);
    if (decodedId?.pgn) decodeData(input, decodedId.pgn);
  }, [decodedId, decodeData]);

  return {
    idInput,
    dataInput,
    decodedId,
    decodedData,
    idError,
    dataError,
    handleIdInputChange,
    handleDataInputChange
  };
};

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  tooltipContent: string;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = React.memo(({ 
  id, label, value, onChange, placeholder, tooltipContent, error 
}) => (
  <div>
    <label htmlFor={id} className="flex text-sm font-medium text-gray-700 mb-1 items-center">
      {label}
      <a data-tooltip-id={`tooltip-${id}`} data-tooltip-content={tooltipContent} data-tooltip-place="right">
        <Info className="ml-1 h-4 w-4 text-gray-400" />
      </a>
      <Tooltip id={`tooltip-${id}`} />
    </label>
    <input
      id={id}
      type="text"
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      placeholder={placeholder}
    />
    {error && (
      <Alert variant="default" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{error}</AlertTitle>
      </Alert>
    )}
  </div>
));

InputField.displayName = 'InputField';

interface DecodedFieldsProps {
  fields: Record<string, string>;
}

const DecodedFields: React.FC<DecodedFieldsProps> = React.memo(({ fields }) => (
  <div className="grid grid-cols-2 gap-4">
    {Object.entries(fields).map(([key, value]) => (
      <div key={key}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
        <input
          type="text"
          value={value}
          readOnly
          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-not-allowed"
        />
      </div>
    ))}
  </div>
));

DecodedFields.displayName = 'DecodedFields';

const NMEA2000Decoder: React.FC = () => {
  const {
    idInput,
    dataInput,
    decodedId,
    decodedData,
    idError,
    dataError,
    handleIdInputChange,
    handleDataInputChange
  } = useCanDecoder();

  const memoizedDecodedIdFields = useMemo(() => 
    decodedId ? Object.fromEntries(Object.entries(decodedId).map(([k, v]) => [k, v.toString()])) : null,
    [decodedId]
  );

  return (
    <div className="min-h-screen flex justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">NMEA 2000 Protocol Decoder</h1>
        <div className="space-y-6">
          <InputField
            id="idInput"
            label="Message ID (4 bytes)"
            value={idInput}
            onChange={handleIdInputChange}
            placeholder="Enter 8 hex characters"
            tooltipContent="Enter the 8-character hexadecimal CAN identifier"
            error={idError}
          />
          {memoizedDecodedIdFields && <DecodedFields fields={memoizedDecodedIdFields} />}
          <InputField
            id="dataInput"
            label="Data (8 bytes)"
            value={dataInput}
            onChange={handleDataInputChange}
            placeholder="Enter 16 hex characters"
            tooltipContent="Enter the 16-character hexadecimal data payload"
            error={dataError}
          />
          {Object.keys(decodedData).length > 0 && <DecodedFields fields={decodedData} />}
        </div>
      </div>
    </div>
  );
};

export default NMEA2000Decoder;