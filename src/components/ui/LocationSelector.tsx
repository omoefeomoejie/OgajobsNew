import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NIGERIA_STATES, NIGERIAN_STATES_LIST } from '@/lib/nigeria';

interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function LocationSelector({ value, onChange, placeholder = 'Select location' }: LocationSelectorProps) {
  // Derive selected state from current value
  const getStateFromValue = (val: string): string => {
    if (!val) return '';
    for (const [state, areas] of Object.entries(NIGERIA_STATES)) {
      if (areas.includes(val)) return state;
    }
    return '';
  };

  const [selectedState, setSelectedState] = useState<string>(() => getStateFromValue(value));

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    onChange(''); // Reset area when state changes
  };

  const areas = selectedState ? NIGERIA_STATES[selectedState] || [] : [];

  return (
    <div className="flex gap-2">
      <Select value={selectedState} onValueChange={handleStateChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="State" />
        </SelectTrigger>
        <SelectContent>
          {NIGERIAN_STATES_LIST.map((state) => (
            <SelectItem key={state} value={state}>{state}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value} onValueChange={onChange} disabled={!selectedState}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={selectedState ? 'Select area' : 'Select state first'} />
        </SelectTrigger>
        <SelectContent>
          {areas.map((area) => (
            <SelectItem key={area} value={area}>{area}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
