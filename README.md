# MyFriendBen

[MyFriendBen](myfriendben.org) was created by [Gary Community Ventures](https://garycommunity.org/), a Denver-based organization. We co-designed MyFriendBen with a group of Colorado families who are participating in a direct cash assistance program. Families told us it was difficult and time-consuming to know what benefits they were entitled to. We are defining “benefits” as public benefits (includes city, county, state and federal), tax credits, financial assistance, nonprofit supports and services. MyFriendBen only includes benefits and tax credits with an annual value of at least $300 or more a year.

Taking inspiration from AccessNYC, and connecting with [PolicyEngine's](https://github.com/PolicyEngine/policyengine-us) API for benefits calculation, we built out a universal benefits screener with the goal to increase benefit participation rates by making key information - like dollar value and time to apply - more transparent, accessible, and accurate. The platform is currently live in Colorado and has been tested with over 40 benefits.

This is the repository for the frontend JavaScript/React multi-step form that collects demographic information from a household that is then sent to the backend benefits API which calculates eligibility and estimated cash value. The backend repository can be accessed [here](https://github.com/Gary-Community-Ventures/benefits-api).

## Set Up Benefits-Calculator (front-end part)
*Back End already should be installed in a separate directory

Clone the project: `git clone https://github.com/Gary-Community-Ventures/benefits-calculator.git`

Install dependencies: `npm install`

#### Set environment variables:

  Create an `.env` file and add the following (available in "Frontend ENV Vars" in our 1Password Engineering vault):

  - REACT_APP_API_KEY

    - The api key for the backend

  - REACT_APP_DOMAIN_URL

    - The url for the backend. Ex: http://localhost:8000

  - REACT_APP_GOOGLE_ANALYTICS_ID [optional]

    - App id for google analytics

  Run server: `npm run dev`

  See local environment at http://localhost:3000/
