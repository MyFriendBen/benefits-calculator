import { FormattedMessage } from 'react-intl';
import { useContext } from 'react';
import { Context } from '../../Components/Wrapper/Wrapper';

type Topics = {
  topic: string;
  subtopic: string;
};

export default function NcLink211Message() {
  const NEEDS_MAPPING: Record<string, Topics> = {
    food: {
      topic: 'Basic%20Needs',
      subtopic: 'Food',
    },
    housing: {
      topic: 'Basic%20Needs',
      subtopic: 'Housing%2FShelter',
    },
    childDevelopment: {
      // Need to confirm
      topic: 'Education',
      subtopic: 'Educational%20Programs',
    },
    familyPlanning: {
      // Need to confirm
      topic: 'Health%20Care',
      subtopic: 'Human%20Reproduction',
    },
    jobResources: {
      // Need to confirm
      topic: 'Income%20Support%20and%20Employment',
      subtopic: 'Employment',
    },
    legalServices: {
      topic: 'Criminal%20Justice%20and%20Legal%20Services',
      subtopic: 'Legal%20Services', // Need to confirm
    },
    veteranServices: {
      topic: 'Organizational%2FCommunity%2FInternational%20Services',
      subtopic: 'Military%20Service',
    },
    // babySupplies --> Need to confirm
    // dentalCare --> Need to confirm
    // support --> Need to confirm
  };

  const { formData } = useContext(Context);

  const zipcode = formData.zipcode;

  const needsData = formData.acuteHHConditions;

  const householdNeeds: Record<string, Topics> = Object.fromEntries(
    Object.entries(needsData)
      .filter(([_, value]) => value === true) // keep only true
      .map(([key]) => [key, NEEDS_MAPPING[key]]) // map to NEEDS_MAPPING
      .filter(([, mapping]) => mapping !== undefined),
  );

  // console.log("houseNeeds", householdNeeds)

  const groupedNeeds = Object.values(householdNeeds).reduce((acc: Record<string, string[]>, { topic, subtopic }) => {
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(subtopic);
    return acc;
  }, {});
  // console.log("groupedNeeds", groupedNeeds)

  const urlsHash = Object.fromEntries(Object.entries(groupedNeeds).map(([topic, subs]) => [topic, subs.join('%2C')]));
  // console.log("urlsHash", urlsHash);

  const BASE_URL = 'https://nc211.org/search/?';
  const ending_url = '&taxonomyCode=';
  const keyword = `keyword=${Object.keys(urlsHash)[0]}`;
  const location = `&location=${zipcode}&distance=10&skip=0`;
  const search = '&searchBtn=Get+Help';
  const topic = `&topic=${Object.keys(urlsHash).join('%2C')}`;
  const subtopic = `&subtopic=${Object.values(urlsHash).join('%2C')}`;

  const queryUrl = BASE_URL + keyword + search + location + topic + subtopic + ending_url;
  // console.log("queryUrl", queryUrl);

  return (
    <div>
      <p>
        <FormattedMessage id="link211.message" defaultMessage="For more local resources please visit " />
        <a href={queryUrl} target="_blank" rel="noopener noreferrer">
          <FormattedMessage id="link211.clickHere" defaultMessage="NC 211's website." />
        </a>
      </p>
    </div>
  );
}
