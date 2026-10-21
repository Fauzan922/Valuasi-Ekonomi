import { useId } from 'react';
import {
  getKabupatenLocations,
  getOtherLocations,
  getProvinceLocations,
} from '../lib/valuation/engine';
import { formatRupiah } from '../lib/valuation/format';

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  id?: string;
  disabled?: boolean;
}

const provinces = [...getProvinceLocations()].sort((a, b) => a.name.localeCompare(b.name, 'id'));
const kabupaten = [...getKabupatenLocations()].sort((a, b) =>
  a.name.localeCompare(b.name, 'id'),
);
const otherLocations = [...getOtherLocations()].sort((a, b) =>
  a.name.localeCompare(b.name, 'id'),
);

export function LocationSelect({
  value,
  onChange,
  label = 'Lokasi acuan UMP',
  hint,
  id,
  disabled,
}: LocationSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="field">
      <label htmlFor={selectId}>{label}</label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <optgroup label="Provinsi">
          {provinces.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name} — {formatRupiah(location.ump)}
            </option>
          ))}
        </optgroup>
        <optgroup label="Kabupaten / Kota">
          {kabupaten.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name} — {formatRupiah(location.ump)}
            </option>
          ))}
        </optgroup>
        {otherLocations.length > 0 ? (
          <optgroup label="Lokasi lain pada tabel UMP">
            {otherLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} — {formatRupiah(location.ump)}
              </option>
            ))}
          </optgroup>
        ) : null}
      </select>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
