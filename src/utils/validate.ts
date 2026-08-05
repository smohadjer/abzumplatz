import Ajv from "ajv";
import ajvErrors from 'ajv-errors';

interface Schema extends Object {}
interface jsonData extends Object {}

// client-side validation
export async function validateData(jsonData: jsonData, schema: Schema, callback: Function) {
  let isValid = true;
  const result = await validate(jsonData, schema);
  if (result && Array.isArray(result)) {
    isValid = false;
    callback(result);
  }
  return isValid;
}

async function validate(json: jsonData, schema: Schema) {
  const ajv = new Ajv({
    coerceTypes: true,
    allErrors: true,
    strict: false,
    loadSchema: async (uri: string) => {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Could not load validation schema: ${uri}`);
      }
      return response.json();
    }
  });

  ajvErrors(ajv);

  const validator = await ajv.compileAsync(schema);
  const valid = validator(json);
  if (!valid) {
    return (validator.errors);
  }
}


