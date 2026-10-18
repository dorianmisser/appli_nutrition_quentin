import { useId } from 'react';

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
}

/** Groupe de boutons radio présentés en tuiles. */
export function Segmented<T extends string>({ legend, name, value, options, onChange, columns = 3 }: Props<T>) {
  const id = useId();
  return (
    <fieldset className="segmented">
      <legend className="field__label">{legend}</legend>
      <div className={`segmented__grid segmented__grid--${columns}`}>
        {options.map((option) => (
          <label key={option.value} className="segmented__option">
            <input
              type="radio"
              name={`${name}-${id}`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              {option.hint && <small>{option.hint}</small>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface ChipsProps<T extends string> {
  legend: string;
  values: T[];
  options: { value: T; label: string }[];
  onChange: (values: T[]) => void;
}

/** Cases à cocher multiples présentées en pastilles. */
export function Chips<T extends string>({ legend, values, options, onChange }: ChipsProps<T>) {
  return (
    <fieldset className="segmented">
      <legend className="field__label">{legend}</legend>
      <div className="chips">
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label key={option.value} className="chip">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(checked ? values.filter((v) => v !== option.value) : [...values, option.value])}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
