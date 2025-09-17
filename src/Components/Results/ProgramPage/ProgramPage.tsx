import { Link, useParams } from 'react-router-dom';
import { Program } from '../../../Types/Results';
import ResultsTranslate from '../Translate/Translate';
import { headingOptionsMappings } from '../CategoryHeading/CategoryHeading';
import BackAndSaveButtons from '../BackAndSaveButtons/BackAndSaveButtons';
import { FormattedMessage, useIntl } from 'react-intl';
import { YearlyValueLabel, programValue, useFormatYearlyValue } from '../FormattedValue';
import './ProgramPage.css';
import WarningMessage from '../../WarningComponent/WarningMessage';
import { useContext, useMemo } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import { findProgramById, findValidationForProgram, useResultsContext, useResultsLink } from '../Results';
import { deleteValidation, postValidation } from '../../../apiCalls';
import { Language } from '../../../Assets/languageOptions';
import { allNavigatorLanguages } from './NavigatorLanguages';
import { formatPhoneNumber } from '../helpers';
import useScreenApi from '../../../Assets/updateScreen';

type ProgramPageProps = {
  program: Program;
};

type IconRendererProps = {
  headingType: string;
};

const ProgramPage = ({ program }: ProgramPageProps) => {
  const { uuid } = useParams();
  const { formData, staffToken } = useContext(Context);
  const { isAdminView, validations, setValidations, programCategories, filtersChecked } = useResultsContext();
  const intl = useIntl();
  const { fetchScreen } = useScreenApi();

  const IconRenderer: React.FC<IconRendererProps> = ({ headingType }) => {
    const IconComponent = headingOptionsMappings[headingType];

    if (!IconComponent) {
      return null;
    }

    return <IconComponent />;
  };
  const currentValidation = findValidationForProgram(validations, program);

  const saveValidation = async () => {
    if (uuid === undefined) {
      throw new Error('somehow the uuid does not exist');
    }

    if (staffToken === undefined) {
      throw new Error('you must be logged in to create a validation');
    }

    const body = {
      screen_uuid: uuid,
      program_name: program.external_name,
      eligible: program.eligible,
      value: program.estimated_value,
    };

    try {
      const response = await postValidation(body, staffToken);
      setValidations([...validations, response]);
      fetchScreen();
    } catch (error) {
      console.error(error);
    }
  };

  const removeValidation = async () => {
    if (currentValidation === undefined) {
      throw new Error('there are no validations for this program');
    }
    if (staffToken === undefined) {
      throw new Error('you must be logged in to create a validation');
    }

    try {
      await deleteValidation(currentValidation.id, staffToken);
      const newValidations = validations.filter((validation) => validation.id !== currentValidation?.id);
      setValidations(newValidations);
      if (newValidations.length === 0) {
        fetchScreen();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleValidation = async () => {
    if (currentValidation !== undefined) {
      removeValidation();
      return;
    }

    saveValidation();
  };

  const category = programCategories.find((category) => {
    for (const categoryProgram of category.programs) {
      if (categoryProgram.external_name === program.external_name) {
        return true;
      }
    }

    return false;
  });

  if (category === undefined) {
    throw new Error(`program with external name "${program.external_name}" is not in a category`);
  }

  const displayIconAndHeader = (program: Program) => {
    return (
      <header className="program-icon-and-header">
        <div className="header-icon-box">
          <IconRenderer headingType={category.icon} />
        </div>
        <div className="header-text">
          <p className="header-text-top">
            <ResultsTranslate translation={category.name} />
          </p>
          <div className="divider"></div>
          <h1 className="header-text-bottom">
            <ResultsTranslate translation={program.name} />
          </h1>
        </div>
      </header>
    );
  };
  const value = useFormatYearlyValue(program);

  const warningMessages = useMemo(() => {
    return program.warning_messages.filter((warningMessage) => {
      if (warningMessage.legal_statuses.length === 0) {
        // if no legal statuses are selected,
        // then assume that the waring is for all legal statuses
        return true;
      }

      for (const status of warningMessage.legal_statuses) {
        if (filtersChecked[status]) {
          return true;
        }
      }

      return false;
    });
  }, [filtersChecked, program]);

  const displayEstimatedValueAndTime = (program: Program) => {
    return (
      <section className="estimation">
        <div className="estimation-text">
          <article className="estimation-text-left">
            <YearlyValueLabel program={program} />
          </article>
          <article className="estimation-text-right slim-text">{value}</article>
        </div>
        <div className="estimation-text">
          <article className="estimation-text-left">
            <FormattedMessage id="results.estimated-time-to-apply" defaultMessage="Estimated Time to Apply" />
          </article>
          <article className="slim-text">
            <ResultsTranslate translation={program.estimated_application_time} />
          </article>
        </div>
      </section>
    );
  };

  const backLink = useResultsLink(`results/benefits`);
  const displayLanguageFlags = (navigatorLanguages: Language[]) => {
    return (
      <div className="navigator-langs-container">
        {navigatorLanguages.map((lang) => {
          return (
            <p className="navigator-lang-flag" key={lang}>
              {allNavigatorLanguages[lang]}
            </p>
          );
        })}
      </div>
    );
  };

  const programApplyButtonLink = intl.formatMessage({
    id: program.apply_button_link.label,
    defaultMessage: program.apply_button_link.default_message,
  });

  return (
    <main className="program-page-container">
      <section className="back-to-results-button-container">
        <BackAndSaveButtons
          navigateToLink={backLink}
          BackToThisPageText={<FormattedMessage id="results.back-to-results-btn" defaultMessage="BACK TO RESULTS" />}
        />
      </section>
      <div className="icon-header-est-values">
        {displayIconAndHeader(program)}
        {displayEstimatedValueAndTime(program)}
      </div>
      <div className="results-program-page-warning-container">
        {warningMessages.map((warning, key) => {
          return <WarningMessage warning={warning} key={key} />;
        })}
      </div>
      <div className="apply-button-container">
        {program.apply_button_link.default_message !== '' && (
          <a className="apply-online-button" href={programApplyButtonLink} target="_blank">
            {program.apply_button_description.default_message == '' ? (
              <FormattedMessage id="results.apply-online" defaultMessage="Apply Online" />
            ) : (
              <ResultsTranslate translation={program.apply_button_description} />
            )}
          </a>
        )}
        {isAdminView && staffToken !== undefined && formData.isTestData && (
          <button className="apply-online-button" onClick={toggleValidation}>
            {currentValidation === undefined ? (
              <FormattedMessage id="results.validations.button.add" defaultMessage="Create Validation" />
            ) : (
              <FormattedMessage id="results.validations.button.remove" defaultMessage="Remove Validation" />
            )}
          </button>
        )}
      </div>
      <div className="content-width">
        {program.navigators.length > 0 && (
          <section className="apply-box">
            <h2 className="content-header">
              <FormattedMessage id="results.get-help-applying" defaultMessage="Get Help Applying" />
            </h2>
            <ul className="apply-box-list">
              {program.navigators.map((navigator, index) => (
                <li key={index} className="apply-info">
                  {navigator.name && (
                    <p className="navigator-name">
                      <ResultsTranslate translation={navigator.name} />
                    </p>
                  )}
                  {navigator.languages && displayLanguageFlags(navigator.languages)}
                  <div className="address-info">
                    {navigator.description && (
                      <p className="navigator-desc">
                        <ResultsTranslate translation={navigator.description} />
                      </p>
                    )}
                    {navigator.assistance_link.default_message && (
                      <div>
                        <a href={navigator.assistance_link.default_message} target="_blank" className="link-color">
                          <FormattedMessage id="results.visit-webiste" defaultMessage="Visit Website" />
                        </a>
                      </div>
                    )}
                    {navigator.email.default_message && (
                      <div>
                        <a href={`mailto:${navigator.email}`} className="link-color email-link">
                          <ResultsTranslate translation={navigator.email} />
                        </a>
                      </div>
                    )}
                    {navigator.phone_number && (
                      <div>
                        <a href={`tel:${navigator.phone_number}`} className="link-color phone-link">
                          {formatPhoneNumber(navigator.phone_number)}
                        </a>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {program.documents.length > 0 && (
          <section className="required-docs">
            <h3 className="content-header">
              <FormattedMessage
                id="results.required-documents-checklist"
                defaultMessage="Required Key Documents Checklist"
              />
            </h3>
            <ul className="required-docs-list">
              {program.documents.map((document, index) => (
                <li key={index}>
                  {<ResultsTranslate translation={document.text} />}
                  {document.link_url.default_message && document.link_text.default_message && (
                    <span className="required-docs-link">
                      <a href={document.link_url.default_message} target="_blank" className="link-color">
                        <ResultsTranslate translation={document.link_text} />
                      </a>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="program-description">
          <ResultsTranslate translation={program.description} />
        </section>
        {program.required_programs.length > 0 && (
          <section className="program-page-required-programs-section">
            <h3 className="program-page-required-programs-header">
              <FormattedMessage
                id="programPage.requiredPrograms.header"
                defaultMessage="Enrollment in one of the following programs is required to be eligible for this program:"
              />
            </h3>
            {program.required_programs.map((programId) => {
              return <RequiredProgram programId={programId} key={programId} />;
            })}
          </section>
        )}
      </div>
    </main>
  );
};

export default ProgramPage;

type RequiredProgramProps = {
  programId: number;
};

function RequiredProgram({ programId }: RequiredProgramProps) {
  const { programs } = useResultsContext();

  const program = findProgramById(programs, programId);
  const programLink = useResultsLink(`results/benefits/${programId}`);

  if (program === undefined) {
    return null;
  }

  const value = programValue(program);

  if (value <= 0) {
    return null;
  }

  return (
    <div className="program-page-required-programs-container">
      <strong>
        <ResultsTranslate translation={program.name} />
      </strong>
      <p>
        <ResultsTranslate translation={program.description} />
      </p>
      <div className="result-program-learn-more-button">
        <Link to={programLink}>
          <FormattedMessage id="programPage.requiredPrograms.link" defaultMessage="Learn More" />
        </Link>
      </div>
    </div>
  );
}
