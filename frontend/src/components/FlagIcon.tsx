interface FlagIconProps {
  code?: string;
  size?: number;
}

export default function FlagIcon({ code, size = 20 }: FlagIconProps) {
  if (!code || code.length !== 2) return null;
  const h = Math.round(size * 0.75);
  return (
    <img
      src={`https://flagcdn.com/${size}x${h}/${code.toLowerCase()}.png`}
      alt={code}
      style={{ verticalAlign: 'middle', marginRight: 3 }}
      width={size}
      height={h}
    />
  );
}
