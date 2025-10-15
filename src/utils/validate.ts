import Ajv from "ajv";
import ajvErrors from 'ajv-errors';

interface Schema extends Object {}
interface jsonData extends Object {}

// client-side validation
export function validateData(jsonData: jsonData, schema: Schema, callback: Function) {
  let isValid = true;
  const result = validate(jsonData, schema);
  if (result && Array.isArray(result)) {
    isValid = false;
    callback(result);
  }
  return isValid;
}

function validate(json: jsonData, schema: Schema) {
  const ajv = new Ajv({
    coerceTypes: true,
    allErrors: true,
    strict: false
  });

  ajvErrors(ajv);

  const validator = ajv.compile(schema);
  const valid = validator(json);
  if (!valid) {
    return (validator.errors);
  }
}



