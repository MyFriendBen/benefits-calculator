import { useIntl } from 'react-intl';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { CardActionArea, Typography, Stack, Box } from '@mui/material';
import { ReactComponent as Checkmark } from '../../Assets/icons/General/OptionCard/checkmark.svg';
import { FieldValues, Path, PathValue, UseFormTrigger, UseFormSetValue } from 'react-hook-form';
import '../OptionCardGroup/OptionCardGroup.css';
import { Context } from '../Wrapper/Wrapper';
import { useContext } from 'react';

type IconType = React.ReactNode;

type TextType = { props: { id: string; defaultMessage: string } };

type Option = {
  icon: IconType;
  text: TextType;
};

export type Options = Record<string, Option | Record<string, Option>>;

type RHFOptionCardGroupProps<T extends FieldValues> = {
  fields: Record<string, boolean>;
  setValue: UseFormSetValue<T>;
  name: Path<T>;
  options: Options;
  triggerValidation?: UseFormTrigger<T>;
  customColumnNo?: string;
};

const RHFOptionCardGroup = <T extends FieldValues>({
  fields,
  setValue,
  name,
  options,
  triggerValidation,
  customColumnNo,
}: RHFOptionCardGroupProps<T>) => {
  const { getReferrer } = useContext(Context);
  const intl = useIntl();

  const handleOptionCardClick = async (optionName: string) => {
    const updatedValue = !fields[optionName];
    setValue(`${name}.${optionName}` as Path<T>, updatedValue as PathValue<T, Path<T>>, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (triggerValidation) {
      await triggerValidation(name);
    }
  };

  const displayOptionCards = (options: Record<any, any>, name: string, values: Record<string, boolean>) => {
    const finalClassname = customColumnNo ? `option-cards-container ${customColumnNo}` : 'option-cards-container';

    const optionCards = Object.keys(options).map((optionKey, index) => {
      const translatedAriaLabel = intl.formatMessage({
        id: options[optionKey].text.props.id,
        defaultMessage: options[optionKey].text.props.defaultMessage,
      });

      const isSelected = values[optionKey];
      let containerClass = 'option-card';
      let actionAreaClass = 'card-action-area';

      if (isSelected) {
        containerClass += ' selected-option-card';
      }

      if (optionKey === 'none') {
        actionAreaClass += ' option-card-none';
      }

      if (getReferrer('featureFlags').includes('white_multi_select_tile_icon')) {
        containerClass += ' white-icons';
      }

      return (
        <CardActionArea
          key={`${name}-key-${index}`}
          className={actionAreaClass}
          onClick={() => handleOptionCardClick(optionKey)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
            }
          }}
        >
          <Card className={containerClass}>
            <Stack direction="row" alignItems="center" justifyContent="center" sx={{ flex: 1, height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', padding: 0, flex: 1, '&:last-child': { paddingBottom: 0 } }}>
                <Box className="option-card-icon">{options[optionKey].icon}</Box>
                <Typography className={isSelected ? 'option-card-text' : ''} sx={{ textAlign: 'left', fontSize: '0.875rem', margin: 0, padding: 0 }}>
                  {translatedAriaLabel}
                </Typography>
              </CardContent>
            </Stack>
          </Card>
        </CardActionArea>
      );
    });

    return <div className={finalClassname}>{optionCards}</div>;
  };

  return <Stack sx={{ alignItems: 'center' }}>{fields && displayOptionCards(options, name, fields)}</Stack>;
};

export default RHFOptionCardGroup;
