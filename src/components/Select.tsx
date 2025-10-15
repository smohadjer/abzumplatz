import { Field } from '../types';
import { ChangeEventHandler } from 'react';

type Option = {
  label: string;
  value: string;
}

type Props = {
  item: Field;
  handleChange: ChangeEventHandler
}
export default function Select(props: Props) {
  const { item } = props;
  return (
    <select
      className={item.error ? "hasError" : ""}
      value={item.value}
      onChange={props.handleChange}
      name={item.name}
      required={item.required}>
        {item.options?.map((option: Option, index: number) =>
          <option
            key={index}
            value={option.value}>
            {option.label}
          </option>
        )}
    </select>
  )
}
