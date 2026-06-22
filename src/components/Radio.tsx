import { Field } from '../types'
import { ChangeEventHandler } from 'react';

type Option = {
  disabled?: boolean;
  label: string;
  value: string | number;
}

type Props = {
  item: Field;
  handleChange: ChangeEventHandler;
}

export default function Radio(props: Props) {
  const {item, handleChange} = props;

  return (
    item.options?.map((option: Option, index: number) =>
      <span key={index} className="nowrap">
        <input
          type="radio"
          id={String(option.value)}
          name={item.name}
          value={option.value}
          checked={item.value === option.value}
          disabled={option.disabled}
          onChange={handleChange}
        />
        <label
          className="label--radio"
          htmlFor={String(option.value)}>
            {option.label}
        </label>
      </span>
    )
  )
}
