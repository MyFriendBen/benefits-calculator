import { Card, CardActionArea } from '@mui/material';
import { ReactNode, useCallback } from 'react';
import { FormattedMessageType } from '../../Types/Questions';
import { Icon } from '../Icon/Icon';
import './SelectTiles.css';

export type MultiSelectTileOption<T extends string | number> = {
  value: T;
  text: FormattedMessageType;
  /** Lucide icon name (kebab-case) or a ReactNode for legacy/EnergyCalculator icons */
  icon: string | ReactNode;
};

type TileProps<T extends string | number> = {
  option: MultiSelectTileOption<T>;
  selected: boolean;
  onClick: () => void;
  variant: 'square' | 'flat';
};

function Tile<T extends string | number>({ option, selected, onClick, variant }: TileProps<T>) {
  const containerClass = [
    'option-card',
    variant === 'square' ? 'tile-square' : 'tile-flat',
    selected && 'option-card--selected',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <CardActionArea className="card-action-area" onClick={onClick} aria-pressed={selected}>
      <Card className={containerClass}>
        <div className="option-card-content">
          <div className="option-card-icon">
            {typeof option.icon === 'string' ? (
              <Icon name={option.icon} className="option-card-lucide-icon" />
            ) : (
              option.icon
            )}
          </div>
          <span className={['option-card-label', selected && 'option-card-selected-text'].filter(Boolean).join(' ')}>
            {option.text}
          </span>
        </div>
      </Card>
    </CardActionArea>
  );
}

// `V` mirrors the caller's value shape: a click spreads the existing object and sets one
// key, never removing any, so the emitted object has the same keys it came in with. Typing
// onChange as `Partial<...>` would flatten that guarantee and break callers whose form
// schema requires every key to be present.
type MultiSelectTilesProps<T extends string | number, V extends Partial<Record<T, boolean>>> = {
  options: MultiSelectTileOption<T>[];
  values: V;
  onChange: (value: V) => void;
  variant?: 'square' | 'flat';
  exclusiveValues?: T[];
};

function MultiSelectTiles<T extends string | number, V extends Partial<Record<T, boolean>>>({
  options,
  values,
  onChange,
  variant = 'flat',
  exclusiveValues = [],
}: MultiSelectTilesProps<T, V>) {
  const handleTileClick = useCallback(
    (clickedValue: T) => {
      const newValues = { ...values } as Record<T, boolean>;
      const selecting = !newValues[clickedValue];
      const isExclusive = exclusiveValues.includes(clickedValue);

      if (selecting && isExclusive) {
        for (const key of Object.keys(newValues) as T[]) {
          if (key !== clickedValue) newValues[key] = false;
        }
      } else if (selecting && !isExclusive) {
        for (const ev of exclusiveValues) newValues[ev] = false;
      }

      newValues[clickedValue] = selecting;
      onChange(newValues as V);
    },
    [values, exclusiveValues, onChange],
  );

  const containerClass = variant === 'square' ? 'option-cards-container' : 'multiselect-tiles-container';

  return (
    <div className={containerClass}>
      {options.map((option) => (
        <Tile
          key={option.value}
          option={option}
          onClick={() => handleTileClick(option.value)}
          selected={!!values[option.value]}
          variant={variant}
        />
      ))}
    </div>
  );
}

export default MultiSelectTiles;
