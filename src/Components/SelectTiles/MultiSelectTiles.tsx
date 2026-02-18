import { Card, CardActionArea } from '@mui/material';
import { ReactNode, useCallback } from 'react';
import { FormattedMessageType } from '../../Types/Questions';
import './SelectTiles.css';

export type MultiSelectTileOption<T extends string | number> = {
  value: T;
  text: FormattedMessageType;
  icon: ReactNode;
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
    <CardActionArea className="card-action-area" onClick={onClick}>
      <Card className={containerClass}>
        <div className="option-card-content">
          <div className="option-card-icon">{option.icon}</div>
          <span className={['option-card-label', selected && 'option-card-selected-text'].filter(Boolean).join(' ')}>
            {option.text}
          </span>
        </div>
      </Card>
    </CardActionArea>
  );
}

type MultiSelectTilesProps<T extends string | number> = {
  options: MultiSelectTileOption<T>[];
  values: Partial<Record<T, boolean>>;
  onChange: (value: Record<T, boolean>) => void;
  variant?: 'square' | 'flat';
  exclusiveValues?: T[];
};

function MultiSelectTiles<T extends string | number>({
  options,
  values,
  onChange,
  variant = 'flat',
  exclusiveValues = [],
}: MultiSelectTilesProps<T>) {
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
      onChange(newValues);
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
