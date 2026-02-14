import { useIntl } from 'react-intl';
import { Card, CardActionArea } from '@mui/material';
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
            <div className="option-card-content">
              <div className="option-card-icon">{options[optionKey].icon}</div>
              <span className={`option-card-label ${isSelected ? 'option-card-text' : ''}`}>
                {translatedAriaLabel}
              </span>
            </div>
          </Card>
        </CardActionArea>
      );
    });

    return <div className={finalClassname}>{optionCards}</div>;
  };

  return <div className="option-cards-wrapper">{fields && displayOptionCards(options, name, fields)}</div>;
};

export default RHFOptionCardGroup;
