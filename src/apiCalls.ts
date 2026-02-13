import { Language } from './Assets/languageOptions';
import { Category, Program } from './Components/CurrentBenefits/CurrentBenefits';
import {
  AdminTokenResponse,
  ProgramCategoryResponse,
  SendMessageRequestData,
  TranslationResponse,
  UrgentNeedTypeResponse,
  UserRequestData,
  ValidationRequestData,
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
const eligibilityEndpoint = `${domain}/api/eligibility/`;
const validationEndpoint = `${domain}/api/validations/`;
const authTokenEndpoint = `${domain}/api/auth-token/`;
const getNpsEndpoint = (uuid: string) => `${domain}/api/screens/${uuid}/nps/`;

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
      return { name: program.name, description: program.website_description };
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
      return { name: program.name, description: program.website_description };
    });

    const { urgent_needs, ...rest } = type;

    types.push({ ...rest, programs: urgentNeeds });
  }
  return types;
};

const postValidation = async (validationBody: ValidationRequestData, key: string) => {
  const staffHeader = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'Token ' + key,
  };

  return await fetch(validationEndpoint, {
    method: 'POST',
    headers: staffHeader,
    body: JSON.stringify(validationBody),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json();
  });
};

const deleteValidation = async (validationid: number, key: string) => {
  const staffHeader = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'Token ' + key,
  };

  return await fetch(validationEndpoint + validationid, {
    method: 'DELETE',
    headers: staffHeader,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  });
};

type NPSScoreData = {
  uuid: string;
  score: number;
  variant: 'floating' | 'inline';
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

export {
  getTranslations,
  postScreen,
  getScreen,
  putScreen,
  putUser,
  postMessage,
  getEligibility,
  getAllLongTermPrograms,
  getAllNearTermPrograms,
  postValidation,
  deleteValidation,
  getAuthToken,
  postNPSScore,
  patchNPSReason,
};
