import { Field } from '../types'
import { ChangeEventHandler } from 'react';

type Option = {
  label: string;
  value: string;
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
          id={option.value}
          name={item.name}
          value={option.value}
          checked={item.value === option.value}
          onChange={handleChange}
        />
        <label
          className="label--radio"
          htmlFor={option.value}>
            {option.label}
        </label>
      </span>
    )
  )
}


