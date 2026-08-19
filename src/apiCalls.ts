import { Language } from './Assets/languageOptions';
import { Category, Program } from './Components/CurrentBenefits/CurrentBenefits';
import {
  AdminTokenResponse,
  HasBenefitsProgram,
  ProgramCategoryResponse,
  SendMessageRequestData,
  TranslationResponse,
  UrgentNeedTypeResponse,
  UserRequestData,
} from './Types/ApiCalls';
import { ApiFormData, ApiFormDataReadOnly } from './Types/ApiFormData';
import { EligibilityResults } from './Types/Results';

const apiKey = 'Token ' + process.env.REACT_APP_API_KEY;
const domain = process.env.REACT_APP_DOMAIN_URL;

const translationsEndpoint = `${domain}/api/translations/`;
const screensEndpoint = `${domain}/api/screens/`;
const userEndpoint = `${domain}/api/users/`;
const messageEndpoint = `${domain}/api/messages/`;
const apiProgramCategoriesEndPoint = `${domain}/api/program_categories/`;
const apiUrgentNeedTypesEndpoint = `${domain}/api/urgent_need_types/`;
export const configEndpoint = `${domain}/api/configuration/`;
const screenerOptionsEndpoint = `${domain}/api/screener-options/`;
const eligibilityEndpoint = `${domain}/api/eligibility/`;
const authTokenEndpoint = `${domain}/api/auth-token/`;
const getNpsEndpoint = (uuid: string) => `${domain}/api/screens/${uuid}/nps/`;
const assistantConversationsEndpoint = (uuid: string) => `${domain}/api/screens/${uuid}/assistant/conversations/`;
const assistantMessagesEndpoint = (uuid: string, conversationId: string) =>
  `${domain}/api/screens/${uuid}/assistant/conversations/${conversationId}/messages/`;

export type ScreenApiResponse = ApiFormDataReadOnly & ApiFormData;

export const header = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: apiKey,
};

const getTranslations = async (lang: Language) => {
  return fetch(translationsEndpoint + `?lang=${lang}`, {
    method: 'GET',
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<TranslationResponse>;
  });
};

const putUser = (userData: UserRequestData, uuid: string) => {
  return fetch(userEndpoint + uuid + '/', {
    method: 'PUT',
    body: JSON.stringify(userData),
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error('A user with this email or phone number already exists in our system.');
    }
  });
};

const postMessage = async (messageData: SendMessageRequestData) => {
  return fetch(messageEndpoint, {
    method: 'POST',
    body: JSON.stringify(messageData),
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json();
  });
};

const getScreen = async (uuid: string) => {
  return fetch(screensEndpoint + uuid, {
    method: 'GET',
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<ScreenApiResponse>;
  });
};

const postScreen = async (partialFormData: ApiFormData) => {
  return fetch(screensEndpoint, {
    method: 'POST',
    body: JSON.stringify(partialFormData),
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<ScreenApiResponse>;
  });
};

const putScreen = async (partialFormData: ApiFormData, uuid: string) => {
  return fetch(screensEndpoint + uuid + '/', {
    method: 'PUT',
    body: JSON.stringify(partialFormData),
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<ScreenApiResponse>;
  });
};

const getEligibility = async (uuid: string, isAdminView?: boolean) => {
  const headerWithLocale = {
    ...header,
  };
  let params = '';
  if (isAdminView) {
    params = '?admin=true';
  }

  return fetch(eligibilityEndpoint + uuid + params, {
    method: 'GET',
    headers: headerWithLocale,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<EligibilityResults>;
  });
};

const getAllLongTermPrograms = async (whiteLabel: string) => {
  const response = await fetch(apiProgramCategoriesEndPoint + whiteLabel, {
    method: 'GET',
    headers: header,
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as ProgramCategoryResponse;

  const categories: Category[] = [];

  for (const category of data) {
    const programs: Program[] = category.programs.map((program) => {
      return {
        name: program.name,
        description: program.website_description,
        link: program.learn_more_link,
      };
    });

    categories.push({ ...category, programs });
  }

  return categories;
};

const getAllNearTermPrograms = async (whiteLabel: string) => {
  const response = await fetch(apiUrgentNeedTypesEndpoint + whiteLabel, {
    method: 'GET',
    headers: header,
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as UrgentNeedTypeResponse;

  const types: Category[] = [];

  for (const type of data) {
    const urgentNeeds: Program[] = type.urgent_needs.map((program) => {
      return {
        name: program.name,
        description: program.website_description,
        link: program.link,
      };
    });

    const { urgent_needs, ...rest } = type;

    types.push({ ...rest, programs: urgentNeeds });
  }
  return types;
};

type NPSScoreData = {
  uuid: string;
  score: number;
};

type NPSReasonData = {
  uuid: string;
  score_reason: string;
};

const postNPSScore = async (data: NPSScoreData) => {
  const { uuid, ...body } = data;
  return fetch(getNpsEndpoint(uuid), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json();
  });
};

const patchNPSReason = async (data: NPSReasonData) => {
  const { uuid, ...body } = data;
  return fetch(getNpsEndpoint(uuid), {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json();
  });
};

const getAuthToken = async (email: string, password: string) => {
  const header = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(authTokenEndpoint, {
    method: 'POST',
    headers: header,
    body: JSON.stringify({
      username: email,
      password: password,
    }),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as AdminTokenResponse;

  return data.token;
};

const getHasBenefitsPrograms = (whiteLabel: string): Promise<HasBenefitsProgram[]> => {
  return fetch(`${screenerOptionsEndpoint}${whiteLabel}/has-benefits-programs/`, {
    method: 'GET',
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<HasBenefitsProgram[]>;
  });
};

export interface ReferralOptionsResponse {
  generic: Record<string, string>;
  partners: Record<string, string>;
}

const getReferralOptions = async (whiteLabel: string, signal?: AbortSignal): Promise<ReferralOptionsResponse> => {
  const response = await fetch(`${screenerOptionsEndpoint}${whiteLabel}/referral-options/`, {
    method: 'GET',
    headers: header,
    signal,
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<ReferralOptionsResponse>;
};

export interface AssistantSuggestedAction {
  type: string;
  label: string;
  url?: string;
}

export interface AssistantApiMessage {
  message_id: string;
  role: 'user' | 'assistant';
  text: string;
  created_at: string;
  suggested_actions?: AssistantSuggestedAction[];
}

export interface AssistantConversationResponse {
  conversation_id: string;
  screen_uuid: string;
  status: string;
  mode: string;
  prompt_version: string;
  messages: AssistantApiMessage[];
}

export interface AssistantMessageResponse {
  user_message: AssistantApiMessage;
  assistant_message: AssistantApiMessage;
}

// A program the results page is currently showing the user. BenBot recommends and
// quotes from these, so both fields have to reflect what's on screen.
export interface AssistantVisibleProgram {
  name_abbreviated: string;
  /**
   * `programValue()` — the ANNUAL value in whole USD, which nets out members who
   * already hold the program's insurance.
   *
   * Not literally the string on the card: for the default `value_format` the card
   * renders this divided by 12 with "/month", and when `estimated_value_override` is
   * set it renders prose ("Varies") with no number at all. Annual is what the backend
   * contract expects — ai-service is told these figures are annual totals and converts
   * when it needs a monthly one.
   */
  value: number;
}

// Open (or resume) a Benbot conversation for a screen.
//
// `visiblePrograms` is what the results page is currently rendering. BenBot may only
// recommend programs from the list it is given, so that list has to match what the
// user is actually looking at — otherwise it recommends programs they can't see, or
// quotes a figure they can't find.
//
// This has to come from the client because the relevant filtering only exists here:
// citizenship/legal status, `excludes_programs` mutual exclusions, and per-member
// insurance all run in the browser, and the server's eligibility snapshot stores no
// member breakdown to reproduce them from.
//
// benefits-api can only ever *narrow* using this list, and it bounds `value` by the
// snapshot's own figure — so a bad list degrades the assistant rather than misleading
// the user.
const startAssistantConversation = async (
  uuid: string,
  locale?: string,
  visiblePrograms?: AssistantVisibleProgram[],
): Promise<AssistantConversationResponse> => {
  return fetch(assistantConversationsEndpoint(uuid), {
    method: 'POST',
    body: JSON.stringify({ locale, visible_programs: visiblePrograms }),
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<AssistantConversationResponse>;
  });
};

// Send a user message to an existing Benbot conversation.
const sendAssistantMessage = async (
  uuid: string,
  conversationId: string,
  text: string,
  clientMessageId?: string,
): Promise<AssistantMessageResponse> => {
  return fetch(assistantMessagesEndpoint(uuid, conversationId), {
    method: 'POST',
    body: JSON.stringify({ text, client_message_id: clientMessageId }),
    headers: header,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<AssistantMessageResponse>;
  });
};

export {
  startAssistantConversation,
  sendAssistantMessage,
  getTranslations,
  postScreen,
  getScreen,
  putScreen,
  putUser,
  postMessage,
  getEligibility,
  getAllLongTermPrograms,
  getAllNearTermPrograms,
  getAuthToken,
  postNPSScore,
  patchNPSReason,
  getHasBenefitsPrograms,
  getReferralOptions,
};
