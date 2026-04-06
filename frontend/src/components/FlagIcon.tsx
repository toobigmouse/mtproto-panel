interface FlagIconProps {
  code?: string;
  size?: number;
}

function countryCodeToEmoji(code: string): string {
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
}

export default function FlagIcon({ code, size = 20 }: FlagIconProps) {
  if (!code || code.length !== 2) return null;
  return (
    <span style={{ fontSize: size * 0.8, verticalAlign: 'middle', marginRight: 3 }}>
      {countryCodeToEmoji(code)}
    </span>
  );
}
