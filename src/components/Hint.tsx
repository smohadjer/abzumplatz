export default function Hint({text}: {text: string | undefined}) {
  return text ? <p className="hint">{text}</p> : null;
}
