import { Field } from '../types';
import { ChangeEventHandler, FormEventHandler } from 'react';

type Props = {
  handleChange: ChangeEventHandler;
  item: Field;
  onInput?: FormEventHandler;
}

export default function Input(props: Props) {
  const { item, handleChange } = props;

  return (
    <input
      type={item.type}
      className={item.error ? "hasError" : ""}
      autoComplete='on'
      name={item.name}
      value={item.value}
      onChange={handleChange}
      placeholder={item.placeholder}
      required={item.required}
    />
  )
}
