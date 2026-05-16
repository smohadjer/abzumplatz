import { ChangeEventHandler, useId, useState } from 'react';

type Props = {
  label: string;
  value: string | number;
  checked: boolean;
  name: string;
  handleChange: ChangeEventHandler;
}

export default function Checkbox(props: Props) {
  const {name, value, label, checked, handleChange} = props;
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const shouldCollapse = label.length > 120;
  const displayLabel = shouldCollapse && !expanded ? label.slice(0, 90).trim() : label;

  return (
      <span className="nowrap">
        <input
          id={id}
          type="checkbox"
          value={value}
          name={name}
          checked={checked}
          onChange={handleChange}
        />
        <label className="label--checkbox" htmlFor={id}>
          {displayLabel}
        </label>
        {shouldCollapse && !expanded &&
          <button
            className="checkbox-details-button"
            type="button"
            aria-label="Vollständigen Datenschutztext anzeigen"
            onClick={() => setExpanded(true)}>...</button>}
      </span>
  )
}

