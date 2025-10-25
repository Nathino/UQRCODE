interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div>
      <label className="block text-gray-800 text-sm mb-2">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded cursor-pointer"
      />
    </div>
  );
}