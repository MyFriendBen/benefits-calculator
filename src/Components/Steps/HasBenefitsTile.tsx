import { Card, CardActionArea } from '@mui/material';
import type { HasBenefitsProgram } from '../../apiCalls';
import ResultsTranslate from '../Results/Translate/Translate';
import './HasBenefitsTile.css';

type Props = {
  program: HasBenefitsProgram;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
};

function HasBenefitsTile({ program, selected, onClick, disabled }: Props) {
  return (
    <CardActionArea
      className="hb-tile-action"
      onClick={disabled ? undefined : onClick}
      aria-pressed={selected}
      disableRipple={disabled}
    >
      <Card className={`hb-tile${selected ? ' hb-tile--selected' : ''}`} elevation={0}>
        <span className="hb-tile-body">
          <strong className="hb-tile-name">
            <ResultsTranslate translation={program.name} />
          </strong>
          <span className="hb-tile-description">
            <ResultsTranslate translation={program.website_description} />
          </span>
        </span>
      </Card>
    </CardActionArea>
  );
}

export default HasBenefitsTile;
