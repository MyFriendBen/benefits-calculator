import { useIntl } from 'react-intl';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { CardActionArea, Typography, Stack, Box } from '@mui/material';
import { FieldValues, Path, PathValue, UseFormTrigger, UseFormSetValue, UseFormClearErrors } from 'react-hook-form';
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
  clearErrors?: UseFormClearErrors<T>;
};

const RHFOptionCardGroup = <T extends FieldValues>({
  fields,
  setValue,
  name,
  options,
  customColumnNo,
  clearErrors,
}: RHFOptionCardGroupProps<T>) => {
  const { getReferrer } = useContext(Context);
  const intl = useIntl();

  const handleOptionCardClick = async (optionName: string) => {
    const updatedValue = !fields[optionName];

    // Handle mutual exclusivity with "none"
    if (optionName === 'none' && updatedValue) {
      // If selecting "none", deselect all other options
      Object.keys(fields).forEach((key) => {
        if (key !== 'none') {
          setValue(`${name}.${key}` as Path<T>, false as PathValue<T, Path<T>>, {
            shouldValidate: false,
            shouldDirty: true,
          });
        }
      });
    } else if (optionName !== 'none' && updatedValue) {
      // If selecting any option other than "none", deselect "none"
      if (fields.none) {
        setValue(`${name}.none` as Path<T>, false as PathValue<T, Path<T>>, {
          shouldValidate: false,
          shouldDirty: true,
        });
      }
    }

    // Set the clicked option's value
    setValue(`${name}.${optionName}` as Path<T>, updatedValue as PathValue<T, Path<T>>, {
      shouldValidate: false,
      shouldDirty: true,
    });

    // Clear errors when user selects an option
    if (clearErrors) {
      clearErrors(name);
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
      if (isSelected) {
        containerClass += ' selected-option-card';
      }

      if (getReferrer('uiOptions').includes('white_multi_select_tile_icon')) {
        containerClass += ' white-icons';
      }

      return (
        <CardActionArea
          key={`${name}-key-${index}`}
          className="card-action-area"
          onClick={() => handleOptionCardClick(optionKey)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
            }
          }}
        >
          <Card className={containerClass}>
            <Stack
              sx={{
                flex: 1,
                height: '100%',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                '@media (max-width: 38.125rem)': {
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  width: '100%',
                },
              }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  '&:last-child': { paddingBottom: 0 },
                  '@media (max-width: 38.125rem)': {
                    flexDirection: 'row',
                    width: '100%',
                    padding: '0 0.3rem',
                  },
                }}
              >
                <Box className="option-card-icon">{options[optionKey].icon}</Box>
                <Typography
                  className={isSelected ? 'option-card-text' : ''}
                  sx={{
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    margin: 0,
                    padding: 0,
                    '@media (max-width: 38.125rem)': {
                      textAlign: 'left',
                      fontSize: '1rem',
                      lineHeight: 1.3,
                      flex: 1,
                    },
                  }}
                >
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
