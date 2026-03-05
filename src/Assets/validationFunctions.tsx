import { useContext, useState } from 'react';
import { Context } from '../Components/Wrapper/Wrapper';
import { FormattedMessage } from 'react-intl';
import type { ErrorController, ValidationFunction, MessageFunction } from '../Types/ErrorController';
import type { SignUpInfo, FormData } from '../Types/FormData';
import ErrorMessageWrapper from '../Components/ErrorMessage/ErrorMessageWrapper';

function useErrorController(hasErrorFunc: ValidationFunction<any>, messageFunc: MessageFunction<any>): ErrorController {
  const { config } = useContext(Context);

  const [hasError, setHasError] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const showError = hasError && submittedCount > 0;

  const incrementSubmitted = () => {
    setSubmittedCount(submittedCount + 1);
  };

  const updateError: ValidationFunction<any> = (value, formData) => {
    const updatedHasError = hasErrorFunc(value, formData, config);
    setHasError(updatedHasError);
    return updatedHasError;
  };

  const message: MessageFunction<any> = (value: string, formData: FormData | undefined) => {
    return messageFunc(value, formData, config);
  };

  return { hasError, showError, submittedCount, incrementSubmitted, setSubmittedCount, updateError, message };
}

const householdAssetsHasError: ValidationFunction<string> = (householdAssets) => {
  return Number(householdAssets) < 0;
};

const displayHouseholdAssetsHelperText: MessageFunction<string> = (householdAssets) => {
  if (householdAssetsHasError(householdAssets)) {
    return (
      <ErrorMessageWrapper>
        <FormattedMessage id="validation-helperText.assets" defaultMessage="Please enter 0 or a positive number." />
      </ErrorMessageWrapper>
    );
  }
};

const emailHasError: ValidationFunction<string> = (email) => {
  return !/^.+@(?:[a-zA-Z0-9]+\.)+[A-Za-z]+$/.test(email);
};

const displayEmailHelperText: MessageFunction<string> = (email) => {
  if (emailHasError(email)) {
    return (
      <ErrorMessageWrapper>
        <FormattedMessage id="validation-helperText.email" defaultMessage="Please enter a valid email address" />
      </ErrorMessageWrapper>
    );
  }
};

const selectHasError: ValidationFunction<string> = (referralSource) => {
  return !referralSource;
};

const displayReferralSourceHelperText: MessageFunction<string> = (source) => {
  if (selectHasError(source)) {
    return (
      <ErrorMessageWrapper>
        <FormattedMessage id="validation-helperText.referralSource" defaultMessage="Please select a referral source." />
      </ErrorMessageWrapper>
    );
  }
};

const displayMissingSelectHelperText: MessageFunction<string> = (source) => {
  if (selectHasError(source)) {
    return (
      <ErrorMessageWrapper>
        <FormattedMessage id="validation-helperText.selectOption" defaultMessage="Please select an option." />
      </ErrorMessageWrapper>
    );
  }
};

const nameHasError: ValidationFunction<string> = (name) => {
  return name === '';
};

const displayFirstNameHelperText: MessageFunction<string> = (firstName) => {
  if (nameHasError(firstName)) {
    return (
      <ErrorMessageWrapper>
        <FormattedMessage id="validation-helperText.firstName" defaultMessage="Please enter your first name" />
      </ErrorMessageWrapper>
    );
  }
};

const displayLastNameHelperText: MessageFunction<string> = (lastName) => {
  if (nameHasError(lastName)) {
    return (
      <ErrorMessageWrapper>
        <FormattedMessage id="validation-helperText.lastName" defaultMessage="Please enter your last name" />
      </ErrorMessageWrapper>
    );
  }
};

const phoneHasError: ValidationFunction<string> = (phoneNumber) => {
  const digitizedPhone = phoneNumber.replace(/\D/g, '');
  return digitizedPhone.length !== 10;
};

const displayPhoneHasErrorHelperText: MessageFunction<string> = (phoneNumber) => {
  if (phoneHasError(phoneNumber)) {
    return (
      <ErrorMessageWrapper>
        <FormattedMessage
          id="validation-helperText.phoneNumber"
          defaultMessage="Please enter a 10 digit phone number"
        />
      </ErrorMessageWrapper>
    );
  }
};

const signUpFormHasError: ValidationFunction<SignUpInfo & { serverError?: boolean }> = (props) => {
  const { email, phone, firstName, lastName, sendUpdates, sendOffers, commConsent, hasUser, serverError } = props;
  const atLeastOneCheckboxSelectionWasMade = sendUpdates === true || sendOffers === true;
  if (hasUser === true) {
    return false;
  }

  return (
    (emailHasError(email) && email !== '') ||
    (phoneHasError(phone) && phone !== '') ||
    (!email && !phone) ||
    !firstName ||
    !lastName ||
    atLeastOneCheckboxSelectionWasMade === false ||
    commConsent === false ||
    serverError === true
  );
};

const signUpServerHasError: ValidationFunction<boolean | undefined> = (serverError) => {
  return serverError === true;
};

const signUpServerErrorHelperText: MessageFunction<SignUpInfo> = (props) => {
  return (
    <ErrorMessageWrapper fontSize="1.5rem">
      <FormattedMessage
        id="validation-helperText.serverError"
        defaultMessage="Please enter a valid email address and/or phone number. This error could also be caused by entering an email address that is already in our system. If the error persists, remember that this question is optional and will not impact your MyFriendBen results. You can skip this question by deselecting the boxes at the top of the page and pressing continue."
      />
    </ErrorMessageWrapper>
  );
};

const signUpOptionsHaveError: ValidationFunction<SignUpInfo> = (signUpInfo) => {
  const { sendOffers, sendUpdates } = signUpInfo;
  const doesNotWantNotifications = sendOffers === false && sendUpdates === false;

  if (doesNotWantNotifications) {
    return false;
  } else {
    return signUpFormHasError(signUpInfo);
  }
};

const otherReferalSourceHelperText: MessageFunction<string> = () => {
  return (
    <ErrorMessageWrapper>
      <FormattedMessage id="errorMessage-otherReferralSource" defaultMessage="Please type in your referral source" />
    </ErrorMessageWrapper>
  );
};

const termsOfServiceHasError: ValidationFunction<boolean> = (isChecked) => {
  return !isChecked;
};

const displayAgreeToTermsErrorMessage: MessageFunction<null> = () => {
  return (
    <ErrorMessageWrapper>
      <FormattedMessage id="disclaimer.error" defaultMessage="Please check the box to continue." />
    </ErrorMessageWrapper>
  );
};

export {
  useErrorController,
  householdAssetsHasError,
  displayHouseholdAssetsHelperText,
  emailHasError,
  displayEmailHelperText,
  selectHasError,
  displayReferralSourceHelperText,
  displayMissingSelectHelperText,
  nameHasError,
  displayFirstNameHelperText,
  displayLastNameHelperText,
  phoneHasError,
  displayPhoneHasErrorHelperText,
  signUpFormHasError,
  signUpServerHasError,
  signUpServerErrorHelperText,
  signUpOptionsHaveError,
  otherReferalSourceHelperText,
  termsOfServiceHasError,
  displayAgreeToTermsErrorMessage,
};
