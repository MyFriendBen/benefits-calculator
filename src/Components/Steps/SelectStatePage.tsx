import { FormControl, Select, InputLabel, MenuItem, FormHelperText } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionHeader from '../QuestionComponents/QuestionHeader';
import { useQueryString } from '../QuestionComponents/questionHooks';
import QuestionQuestion from '../QuestionComponents/QuestionQuestion';
import PrevAndContinueButtons from '../PrevAndContinueButtons/PrevAndContinueButtons';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import * as z from 'zod';
import ErrorMessageWrapper from '../ErrorMessage/ErrorMessageWrapper';
import { useUpdateWhiteLabelAndNavigate } from '../RouterUtil/RedirectToWhiteLabel';
import QuestionDescription from '../QuestionComponents/QuestionDescription';
import { zodResolver } from '@hookform/resolvers/zod';
import { OTHER_PAGE_TITLES } from '../../Assets/pageTitleTags';
import { usePageTitle } from '../Common/usePageTitle';

export const STATES: { [key: string]: string } = { co: 'Colorado', nc: 'North Carolina' };

const SelectStatePage = () => {
  const { whiteLabel, uuid } = useParams();

  const queryString = useQueryString();
  const navigate = useNavigate();

  usePageTitle(OTHER_PAGE_TITLES.state);

  const { formatMessage } = useIntl();

  const formSchema = z.object({
    state: z
      .string({
        errorMap: () => {
          return { message: formatMessage({ id: 'stateStep.error', defaultMessage: 'Please select a state' }) };
        },
      })
      .min(1),
  });

  type FormSchema = z.infer<typeof formSchema>;

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      state: whiteLabel ?? '',
    },
  });

  const updateWhiteLabelAndNavigate = useUpdateWhiteLabelAndNavigate();

  const submitHandler: SubmitHandler<FormSchema> = ({ state }) => {
    let navUrl = `/${state}/step-2${queryString}`;
    if (uuid !== undefined) {
      navUrl = `/${state}/${uuid}/step-2${queryString}`;
    }
    updateWhiteLabelAndNavigate(state, navUrl);
  };

  const createMenuItems = () => {
    const disabledSelectMenuItem = (
      <MenuItem value="disabled-select" key="disabled-select" disabled>
        <FormattedMessage id="selectState.disabledItem" defaultMessage="Choose your state" />
      </MenuItem>
    );

    const dropdownMenuItems = Object.entries(STATES).map(([value, message]) => {
      return (
        <MenuItem value={value} key={value}>
          {message}
        </MenuItem>
      );
    });

    return [disabledSelectMenuItem, dropdownMenuItems];
  };

  const backNavigationFunction = () => {
    if (uuid !== undefined && whiteLabel !== undefined) {
      navigate(`/${whiteLabel}/${uuid}/step-1${queryString}`);
      return;
    }

    navigate(`/step-1${queryString}`);
  };

  return (
    <main className="benefits-form">
      <QuestionHeader>
        <FormattedMessage id="stateStep.header" defaultMessage="Before you begin..." />
      </QuestionHeader>
      <QuestionQuestion>
        <FormattedMessage id="stateStep.question" defaultMessage="What is your state?" />
      </QuestionQuestion>
      <QuestionDescription>
        <FormattedMessage id="stateStep.missingState.1" defaultMessage="Don't see your state? Click " />
        <a href="https://www.myfriendben.org/" className="link-color">
          <FormattedMessage id="stateStep.missingState.link" defaultMessage="here" />
        </a>
      </QuestionDescription>
      <form onSubmit={handleSubmit(submitHandler)}>
        <FormControl sx={{ mt: 1, mb: 2, minWidth: 210, maxWidth: '100%' }} error={errors.state !== undefined}>
          <InputLabel>
            <FormattedMessage id="stateStep.placeholder" defaultMessage="State" />
          </InputLabel>
          <Controller
            name="state"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <>
                <Select
                  {...field}
                  labelId="county-select-label"
                  id="state-source-select"
                  label={<FormattedMessage id="stateStep.placeholder" defaultMessage="State" />}
                >
                  {createMenuItems()}
                </Select>
                {errors.state !== undefined && (
                  <FormHelperText>
                    <ErrorMessageWrapper fontSize="1rem">{errors.state.message}</ErrorMessageWrapper>
                  </FormHelperText>
                )}
              </>
            )}
          />
        </FormControl>
        <div style={{ marginTop: '1rem' }}>
          <PrevAndContinueButtons backNavigationFunction={backNavigationFunction} />
        </div>
      </form>
    </main>
  );
};

export default SelectStatePage;
