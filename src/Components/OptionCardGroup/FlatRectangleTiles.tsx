import { Card, CardActionArea } from '@mui/material';
import { ReactNode, useContext, useMemo } from 'react';
import { FormattedMessageType } from '../../Types/Questions';
import './FlatRectangleTiles.css';
import { Context } from '../Wrapper/Wrapper';

export type FlatRectangleTileOption<T extends string | number> = {
  value: T;
  text: FormattedMessageType;
  icon: ReactNode;
};

type TileProps<T extends string | number> = {
  option: FlatRectangleTileOption<T>;
  selected: boolean;
  onClick: () => void;
};

function Tile<T extends string | number>({ option, selected, onClick }: TileProps<T>) {
  const { getReferrer } = useContext(Context);

  const featureFlags = getReferrer('featureFlags');
  const containerClass = useMemo(() => {
    let className = 'flat-rectangle-card';

    if (selected) {
      className += ' selected-flat-rectangle-card';
    }

    if (featureFlags.includes('white_multi_select_tile_icon')) {
      className += ' white-icons';
    }

    return className;
  }, [selected, featureFlags]);

  return (
    <CardActionArea className="flat-rectangle-action-area" onClick={onClick}>
      <Card className={containerClass}>
        <div className="flat-rectangle-card-container">
          <div className="flat-rectangle-icon">{option.icon}</div>
          <div className={selected ? 'flat-rectangle-card-text' : ''}>{option.text}</div>
        </div>
      </Card>
    </CardActionArea>
  );
}

type FlatRectangleTilesProps<T extends string | number> = {
  options: FlatRectangleTileOption<T>[];
  values: Record<T, boolean>;
  onChange: (value: Record<T, boolean>) => void;
};

function FlatRectangleTiles<T extends string | number>({ options, values, onChange }: FlatRectangleTilesProps<T>) {
  return (
    <div className="flat-rectangle-tiles-container">
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

export default FlatRectangleTiles;
