import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Program, LifetimeProjection, EnhancedEligibilityResults } from '../../../Types/Results';
import ResultsTranslate from '../Translate/Translate';
import { headingOptionsMappings } from '../CategoryHeading/CategoryHeading';
import BackAndSaveButtons from '../BackAndSaveButtons/BackAndSaveButtons';
import { FormattedMessage, useIntl } from 'react-intl';
import { YearlyValueLabel, programValue, useFormatYearlyValue } from '../FormattedValue';
import './ProgramPage.css';
import WarningMessage from '../../WarningComponent/WarningMessage';
import { useContext, useMemo, useState, useEffect } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import { findProgramById, findValidationForProgram, useResultsContext, useResultsLink } from '../Results';
import { deleteValidation, postValidation, getProgramEligibility } from '../../../apiCalls';
import { Language } from '../../../Assets/languageOptions';
import { allNavigatorLanguages } from './NavigatorLanguages';
import { formatPhoneNumber } from '../helpers';
import useScreenApi from '../../../Assets/updateScreen';
import { Box, Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import JsonView from '@uiw/react-json-view';
import { redactPolicyEngineData } from '../../../Assets/policyEngineRedaction';
import DetailedLifetimeProjectionDisplay from '../LifetimeSummary/DetailedLifetimeProjectionDisplay';
import LifetimeProjectionErrorBoundary from '../LifetimeSummary/LifetimeProjectionErrorBoundary';
import { useLanguageSupportsLifetimeProjections } from '../hooks/useLifetimeProjections';

type ProgramPageProps = {
  program: Program;
};

type IconRendererProps = {
  headingType: string;
};

const ProgramPage = ({ program }: ProgramPageProps) => {
  const { uuid } = useParams();
  const [searchParams] = useSearchParams();
  const { formData, staffToken, locale } = useContext(Context);
  const { isAdminView, validations, setValidations, programCategories, filtersChecked } = useResultsContext();
  const intl = useIntl();
  const { fetchScreen } = useScreenApi();
  const [openPEmodal, setOpenPEModal] = useState(false);
  const { policyEngineData } = useResultsContext();

  // Lifetime projection state
  const [lifetimeProjection, setLifetimeProjection] = useState<LifetimeProjection | undefined>();
  const [lifetimeProjectionError, setLifetimeProjectionError] = useState<string | undefined>();
  const [isLoadingLifetimeProjection, setIsLoadingLifetimeProjection] = useState(false);

  // Check language support and URL parameters for lifetime projections
  const languageSupportsLifetime = useLanguageSupportsLifetimeProjections(locale);
  const urlRequestsLifetime = searchParams.get('include_lifetime_projections') === 'true';
  const shouldRequestLifetimeProjections = languageSupportsLifetime || urlRequestsLifetime;

  const openPolicyEngineRequest = () => setOpenPEModal(true);
  const closePolicyEngineRequest = () => setOpenPEModal(false);
  const [collapsed, setCollapsed] = useState<boolean | number>(3);
  const redacted = redactPolicyEngineData(policyEngineData!);

  // Fetch program-specific lifetime projection data
  useEffect(() => {
    console.log('useEffect triggered - Lifetime projection data fetch', {
      shouldRequestLifetimeProjections,
      uuid,
      programId: program.program_id,
      languageSupportsLifetime,
      urlRequestsLifetime
    });

    const fetchLifetimeProjection = async () => {
      if (!shouldRequestLifetimeProjections || !uuid) {
        console.log('Early return from useEffect', { shouldRequestLifetimeProjections, uuid });
        return;
      }

      setIsLoadingLifetimeProjection(true);
      setLifetimeProjectionError(undefined);

      try {
        const enhancedResults = await getProgramEligibility(
          uuid,
          program.program_id.toString(),
          isAdminView,
          true
        );

        // Handle program-specific API response format
        console.log('Program API response:', enhancedResults);
        if (enhancedResults.lifetime_projection?.program_projection) {
          console.log('Setting lifetime projection:', enhancedResults.lifetime_projection.program_projection);
          setLifetimeProjection(enhancedResults.lifetime_projection.program_projection);
        } else if (enhancedResults.lifetime_projection?.error) {
          console.log('Lifetime projection error:', enhancedResults.lifetime_projection.error);
          setLifetimeProjectionError(enhancedResults.lifetime_projection.error.message);
        } else {
          console.log('No lifetime projection data found in response');
        }
      } catch (error) {
        console.warn('Failed to fetch lifetime projection for program:', error);
        setLifetimeProjectionError('Failed to load lifetime projection data');
      } finally {
        setIsLoadingLifetimeProjection(false);
      }
    };

    fetchLifetimeProjection();
  }, [uuid, program.program_id, shouldRequestLifetimeProjections, isAdminView]);

  const downloadPolicyEngineRequest = () => {
    if (!policyEngineData) return;
    const dataStr = JSON.stringify(redacted, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'policy-engine-data.json';
    link.click();

    URL.revokeObjectURL(url);
  };

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
        <>
          {isAdminView && !!staffToken && (
            <a
              role="button"
              className="pe-request-button"
              onClick={openPolicyEngineRequest}
              data-testid="pe-data-button"
            >
              <FormattedMessage id="policy_engine_request_button" defaultMessage="Policy Engine API" />
            </a>
          )}

          <Dialog
            open={openPEmodal}
            onClose={closePolicyEngineRequest}
            maxWidth="md"
            fullWidth
            disableScrollLock
            data-testid="pe-data-dialog"
            PaperProps={{
              sx: {
                height: '75vh',
                display: 'flex',
                flexDirection: 'column',
              },
            }}
          >
            <DialogTitle>
              <FormattedMessage id="policy_engine_modal_title" defaultMessage="Policy Engine API Data" />
            </DialogTitle>
            <DialogContent
              dividers
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: 2,
                }}
              >
                <ButtonGroup variant="text" color="primary" size="small">
                  <Button id='policy_engine_expand_all_button' onClick={() => setCollapsed(false)}>Expand All</Button>
                  <Button id='policy_engine_collapse_button' onClick={() => setCollapsed(3)}>By Default</Button>
                </ButtonGroup>
              </Box>
              <Typography component="pre" style={{ whiteSpace: 'pre-wrap' }}>
                <JsonView value={redacted} collapsed={collapsed} />
              </Typography>
            </DialogContent>
            <DialogActions>
              <div className="pe-modal-button-container">
                <a
                  role="button"
                  className="pe-request-button"
                  onClick={downloadPolicyEngineRequest}
                  data-testid="pe-data-download-button"
                >
                  <FormattedMessage id="policy_engine_download_button" defaultMessage="Download" />
                </a>
                <a
                  role="button"
                  className="pe-request-button"
                  onClick={closePolicyEngineRequest}
                  data-testid="pe-data-close-button"
                >
                  <FormattedMessage id="policy_engine_close_button" defaultMessage="Close" />
                </a>
              </div>
            </DialogActions>
          </Dialog>
        </>
        {isAdminView && staffToken !== undefined && formData.isTestData && (
          <a role="button" className="apply-online-button" onClick={toggleValidation}>
            {currentValidation === undefined ? (
              <FormattedMessage id="results.validations.button.add" defaultMessage="Create Validation" />
            ) : (
              <FormattedMessage id="results.validations.button.remove" defaultMessage="Remove Validation" />
            )}
          </a>
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

        {/* Lifetime projection display for this program */}
        {console.log('Render check:', { shouldRequestLifetimeProjections, lifetimeProjection, isLoadingLifetimeProjection, lifetimeProjectionError })}
        {shouldRequestLifetimeProjections && lifetimeProjection && (
          <LifetimeProjectionErrorBoundary>
            <DetailedLifetimeProjectionDisplay
              projection={lifetimeProjection}
              className="program-page-lifetime-projection"
            />
          </LifetimeProjectionErrorBoundary>
        )}

        {/* Show loading state for lifetime projections */}
        {shouldRequestLifetimeProjections && isLoadingLifetimeProjection && (
          <section className="lifetime-summary-section">
            <div className="lifetime-summary-card">
              <p>
                <FormattedMessage
                  id="program-page.lifetime-projection.loading"
                  defaultMessage="Loading lifetime benefit projection..."
                />
              </p>
            </div>
          </section>
        )}

        {/* Show error state for lifetime projections */}
        {shouldRequestLifetimeProjections && lifetimeProjectionError && (
          <section className="lifetime-summary-section">
            <div className="lifetime-summary-card">
              <p className="error-message">
                <FormattedMessage
                  id="program-page.lifetime-projection.error"
                  defaultMessage="Unable to load lifetime benefit projection. Please try again later."
                />
              </p>
            </div>
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
