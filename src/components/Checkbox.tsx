import { ChangeEventHandler } from 'react';

type Props = {
  label: string;
  value: string | number;
  checked: boolean;
  name: string;
  handleChange: ChangeEventHandler;
}

export default function Checkbox(props: Props) {
  const {name, value, label, checked, handleChange} = props;

  return (
      <span className="nowrap">
        <label className="label--checkbox">
          <input
            type="checkbox"
            value={value}
            name={name}
            checked={checked}
            onChange={handleChange}
          />
          {label}
        </label>
      </span>
  )
}


