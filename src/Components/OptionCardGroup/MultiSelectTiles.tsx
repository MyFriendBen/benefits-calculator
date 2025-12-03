import { Card, CardActionArea } from '@mui/material';
import { ReactNode, useContext, useMemo } from 'react';
import { FormattedMessageType } from '../../Types/Questions';
import './MultiSelectTiles.css';
import { Context } from '../Wrapper/Wrapper';

export type MultiSelectTileOption<T extends string | number> = {
  value: T;
  text: FormattedMessageType;
  icon: ReactNode;
};

type TileProps<T extends string | number> = {
  option: MultiSelectTileOption<T>;
  selected: boolean;
  onClick: () => void;
};

function Tile<T extends string | number>({ option, selected, onClick }: TileProps<T>) {
  const { getReferrer } = useContext(Context);

  const featureFlags = getReferrer('featureFlags');
  const containerClass = useMemo(() => {
    let className = 'option-card';

    if (selected) {
      className += ' selected-option-card';
    }

    if (featureFlags.includes('white_multi_select_tile_icon')) {
      className += ' white-icons';
    }

    return className;
  }, [selected, featureFlags]);

  return (
    <CardActionArea className="card-action-area" onClick={onClick}>
      <Card className={containerClass}>
        <div className="multi-select-card-container">
          <div className="multi-select-icon">{option.icon}</div>
          <div className={selected ? 'option-card-text' : ''}>{option.text}</div>
        </div>
      </Card>
    </CardActionArea>
  );
}

type MultiSelectTilesProps<T extends string | number> = {
  options: MultiSelectTileOption<T>[];
  values: Record<T, boolean>;
  onChange: (value: Record<T, boolean>) => void;
};

function MultiSelectTiles<T extends string | number>({ options, values, onChange }: MultiSelectTilesProps<T>) {
  return (
    <div className="multiselect-tiles-container">
      {options.map((option, index) => {
        const onClick = () => {
          let newValues: Record<T, boolean> = { ...values };
          newValues[option.value] = !newValues[option.value];

          onChange(newValues);
        };

        const selected = values[option.value];

        return <Tile option={option} onClick={onClick} key={index} selected={selected} />;
      })}
    </div>
  );
}

export default MultiSelectTiles;
