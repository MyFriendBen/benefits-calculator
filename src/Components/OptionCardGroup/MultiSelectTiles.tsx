import { Card, CardActionArea } from '@mui/material';
import { ReactNode, useContext, useMemo } from 'react';
import { FormattedMessageType } from '../../Types/Questions';
import './OptionCardGroup.css';
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
  variant: 'square' | 'flat';
};

function Tile<T extends string | number>({ option, selected, onClick, variant }: TileProps<T>) {
  const { getReferrer } = useContext(Context);

  const uiOptions = getReferrer('uiOptions');
  const containerClass = useMemo(() => {
    let className = 'option-card';
    className += variant === 'square' ? ' tile-square' : ' tile-flat';

    if (selected) {
      className += ' selected-option-card';
    }

    if (uiOptions.includes('white_multi_select_tile_icon')) {
      className += ' white-icons';
    }

    return className;
  }, [selected, uiOptions, variant]);

  return (
    <CardActionArea className="card-action-area" onClick={onClick}>
      <Card className={containerClass}>
        <div className="option-card-content">
          <div className="option-card-icon">{option.icon}</div>
          <span className={`option-card-label ${selected ? 'option-card-selected-text' : ''}`}>{option.text}</span>
        </div>
      </Card>
    </CardActionArea>
  );
}

type MultiSelectTilesProps<T extends string | number> = {
  options: MultiSelectTileOption<T>[];
  values: Record<T, boolean>;
  onChange: (value: Record<T, boolean>) => void;
  variant?: 'square' | 'flat';
};

function MultiSelectTiles<T extends string | number>({ options, values, onChange, variant = 'flat' }: MultiSelectTilesProps<T>) {
  const containerClass = variant === 'square' ? 'option-cards-container' : 'multiselect-tiles-container';

  const tiles = options.map((option, index) => {
    const onClick = () => {
      let newValues: Record<T, boolean> = { ...values };
      newValues[option.value] = !newValues[option.value];

      onChange(newValues);
    };

    const selected = values[option.value];

    return <Tile option={option} onClick={onClick} key={option.value} selected={selected} variant={variant} />;
  });

  if (variant === 'square') {
    return (
      <div className="option-cards-wrapper">
        <div className={containerClass}>{tiles}</div>
      </div>
    );
  }

  return <div className={containerClass}>{tiles}</div>;
}

export default MultiSelectTiles;
