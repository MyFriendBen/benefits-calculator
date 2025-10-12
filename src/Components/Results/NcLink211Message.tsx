import { FormattedMessage } from 'react-intl';
import React, { useContext } from 'react';
import { Context } from '../../Components/Wrapper/Wrapper';

type Topics = {
  topic: string;
  subtopic: string;
  keyword: string;
  displayText: string;
};

export default function NcLink211Message() {
  const NEEDS_MAPPING: Record<string, Topics> = {
    food: {
      topic: 'Basic%20Needs',
      subtopic: 'Food',
      keyword: 'Food groceries',
      displayText: 'Food or groceries',
    },
    housing: {
      topic: 'Basic%20Needs',
      subtopic: 'Housing%2FShelter',
      keyword: 'rent utilities mortgage',
      displayText:'Help with managing your mortgage, rent, or utilities',
    },
    childDevelopment: {
      topic: 'Education%2CIndividual%20and%20Family%20Life',
      subtopic: 'Educational%20Institutions%2FSchools%2CEducational%20Programs%2CEducational%20Support%20Services%2CIndividual%20and%20Family%20Support%20Services%2CSocial%20Development%20and%20Enrichment',
      keyword: 'child development',
      displayText: "Concern about your child's development",
    },
    familyPlanning: {
      topic: 'Health%20Care',
      subtopic: 'Human%20Reproduction',
      keyword: 'Family planning',
      displayText: 'Family planning or birth control',
    },
    support: {
      topic: 'Mental+Health+and+Substance+Use+Disorder+Services',
      subtopic: 'Mental+Health+Assessment+and+Treatment%2CMental+Health+Support+Services',
      keyword: 'mental health',
      displayText: 'A challenge you or your child would like to talk about',
    },
    dentalCare: {
      topic: 'Health+Care',
      subtopic: 'Specialized+Treatment+and+Prevention%2CSpecialty+Medicine',
      keyword: 'dental care',
      displayText: 'Low-cost dental care',
    },
    jobResources: {
      topic: 'Income%20Support%20and%20Employment',
      subtopic: 'Employment%2CTemporary%20Financial%20Assistance',
      keyword: 'Job resources',
      displayText: 'Job resources',
    },
    legalServices: {
      topic: 'Criminal%20Justice%20and%20Legal%20Services', //Criminal+Justice+and+Legal+Services
      subtopic: 'Legal%20Services', //Legal+Services
      keyword: 'civil legal services',
      displayText: 'Free or low-cost help with civil legal needs or identity documents',
    },
    babySupplies: {
      topic: 'Material%20Goods',
      subtopic: 'Basic%20Needs',
      keyword: 'baby supplies',
      displayText: 'Diapers and other baby supplies',
    },
    veteranServices: {
      topic: 'Organizational%2FCommunity%2FInternational+Services%2CTarget+Populations',
      subtopic: 'Military+Service%2CMilitary+Personnel%2FContractors',
      keyword: 'veterans services',
      displayText: 'Veterans services',
    },
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

  const BASE_URL = 'https://nc211.org/search/?';
  const ending_url = '&taxonomyCode=';
  const location = `&location=${zipcode}&distance=10&skip=0`;
  const search = '&searchBtn=Get+Help';

  const buildQueryURL = (value: Topics)=>{
    const keyword = `keyword=${value.keyword}`;
    const topic = `&topic=${value.topic}`;
    const subtopic = `&subtopic=${value.subtopic}`;

    return BASE_URL + keyword + search + location + topic + subtopic + ending_url;
  }

  return(
    <div>
      <FormattedMessage id="link211.message" defaultMessage="More local resources from NC211: " />
      {Object.entries(householdNeeds).map(([key, value], index, arr) => (
        <React.Fragment key={key}>
          <a
            href={buildQueryURL(value)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "#e6e7e8",
              borderRadius: "9999px",
              padding: "3px 8px",
              textDecoration: "underline",
              color: "#21296B",
              fontSize: "0.9rem",
              fontWeight: "700",
              fontFamily: 'Open Sans, sans-serif',
              display: "inline-block",
              marginBottom: "0.5rem",
            }}
          >
            {value.displayText}
          </a>
          {/* Add separator only between items */}
          {index < arr.length - 1 && <span style={{ color: "#21296B"}}> | </span>}
        </React.Fragment>
      ))}
    </div>
  );
}


{/* 
  <a href={queryUrl} target="_blank" rel="noopener noreferrer">
    <FormattedMessage id="link211.clickHere" defaultMessage="NC 211's website." />
  </a> 
*/}