export default function ErrorComponent({error}: {error: string | undefined}) {
  return error ? <p className="error">{error}</p> : null;
}

