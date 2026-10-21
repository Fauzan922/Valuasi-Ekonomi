import { useId } from 'react';
import { reference } from '../data/reference';

interface EcosystemSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  id?: string;
  allowed?: string[];
  includeEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
}

export function EcosystemSelect({
  value,
  onChange,
  label = 'Jenis ekosistem',
  hint,
  id,
  allowed,
  includeEmpty = false,
  emptyLabel = 'Pilih ekosistem',
  disabled,
}: EcosystemSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const options = reference.ecosystems.filter(
    (ecosystem) => !allowed || allowed.includes(ecosystem.name),
  );
  return (
    <div className="field">
      <label htmlFor={selectId}>{label}</label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {includeEmpty ? <option value="">{emptyLabel}</option> : null}
        {options.map((ecosystem) => (
          <option key={ecosystem.id} value={ecosystem.name}>
            {ecosystem.name}
          </option>
        ))}
      </select>
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
