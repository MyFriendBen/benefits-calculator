import { useState } from 'react';

export type ThemeName = 'default' | 'twoOneOne' | 'twoOneOneNC' | 'co_energy' | 'nc_lanc';

export interface ITheme {
  primaryColor: string;
  secondaryColor: string;
  midBlueColor: string;
  footerColor: string;
  secondaryBackgroundColor: string;
  hoverColor: string;
  outlineHoverBackgroundColor: string;
  outlineHoverColor: string;
  progressBarColor: string;
  cssVariables: {
    '--primary-color': string;
    '--secondary-color': string;
    '--secondary-background-color': string;
    '--main-max-width': string;
    'font-size': string;
    '--midBlue-color': string;
    '--hover-color': string;
    '--icon-color': string;
    '--secondary-icon-color': string;
    '--option-card-hover-font-color': string;
    '--footer-color': string;
    '--active-border-color': string;
    '--warning-background-color'?: string;
    '--warning-text-color'?: string;
  };
}

export type Themes = Record<ThemeName, ITheme>;

const themes: Themes = {
  default: {
    primaryColor: '#293457',
    secondaryColor: '#B85A27',
    secondaryBackgroundColor: '#FBF9FC',
    midBlueColor: '#41528C',
    footerColor: '#41528C',
    hoverColor: '#ECDEED',
    outlineHoverColor: '#293457',
    outlineHoverBackgroundColor: '#ECDEED',
    progressBarColor: '#D6743F',
    cssVariables: {
      '--primary-color': '#293457',
      '--secondary-color': '#B85A27',
      '--secondary-background-color': '#FBF9FC',
      '--main-max-width': '1310px',
      'font-size': '18px',
      '--midBlue-color': '#41528C',
      '--hover-color': '#ECDEED',
      '--icon-color': '#D6743F',
      '--secondary-icon-color': '#D6743F',
      '--option-card-hover-font-color': '#1D1C1E',
      '--footer-color': '#41528C',
      '--active-border-color': '#B85A27',
    },
  },
  twoOneOne: {
    primaryColor: '#005191',
    secondaryColor: '#005191',
    midBlueColor: '#005191',
    footerColor: '#ffffff',
    secondaryBackgroundColor: '#F7F7F7',
    hoverColor: '#FFFFFF',
    outlineHoverBackgroundColor: '#005191',
    outlineHoverColor: '#FFFFFF',
    progressBarColor: '#539ED0',
    cssVariables: {
      '--primary-color': '#005191',
      '--secondary-color': '#005191',
      '--secondary-background-color': '#F7F7F7',
      '--main-max-width': '1310px',
      'font-size': '18px',
      '--midBlue-color': '#41528C',
      '--hover-color': '#EFEFEF',
      '--icon-color': '#ff443b',
      '--secondary-icon-color': '#005191',
      '--option-card-hover-font-color': '#1D1C1E',
      '--footer-color': '#ffffff',
      '--active-border-color': '#005191',
    },
  },
  twoOneOneNC: {
    primaryColor: '#21296B',
    secondaryColor: '#21296B',
    midBlueColor: '#41528C',
    footerColor: '#ffffff',
    secondaryBackgroundColor: '#F7F7F7',
    hoverColor: '#FFFFFF',
    outlineHoverBackgroundColor: '#21296B',
    outlineHoverColor: '#FFFFFF',
    progressBarColor: '#5082F0',
    cssVariables: {
      '--primary-color': '#21296B',
      '--secondary-color': '#21296B',
      '--secondary-background-color': '#F7F7F7',
      '--main-max-width': '1310px',
      'font-size': '18px',
      '--midBlue-color': '#41528C',
      '--hover-color': '#FFFFFF',
      '--icon-color': '#ff443b',
      '--secondary-icon-color': '#21296B',
      '--option-card-hover-font-color': '#1D1C1E',
      '--footer-color': '#ffffff',
      '--active-border-color': '#21296B',
    },
  },
  nc_lanc: {
    primaryColor: '#003863',
    secondaryColor: '#003863',
    midBlueColor: '#003863',
    footerColor: '#FFFFFF',
    secondaryBackgroundColor: '#F7F7F7',
    hoverColor: '#FFFFFF',
    outlineHoverBackgroundColor: '#003863',
    outlineHoverColor: '#FFFFFF',
    progressBarColor: '#268FBF',
    cssVariables: {
      '--primary-color': '#003863',
      '--secondary-color': '#003863',
      '--secondary-background-color': '#F7F7F7',
      '--main-max-width': '1310px',
      'font-size': '18px',
      '--midBlue-color': '#003863',
      '--hover-color': '#FFFFFF',
      '--icon-color': '#D6743F',
      '--secondary-icon-color': '#000000',
      '--option-card-hover-font-color': '#1D1C1E',
      '--footer-color': '#FFFFFF',
      '--active-border-color': '#8CCCF2',
    },
  },
  co_energy: {
    primaryColor: '#001970',
    secondaryColor: '#001970',
    midBlueColor: '#001970',
    footerColor: '#373737',
    secondaryBackgroundColor: '#FBFBFB',
    hoverColor: '#FFFFFF',
    outlineHoverBackgroundColor: '#FBFBFB',
    outlineHoverColor: '#001970',
    progressBarColor: '#FFD100',
    cssVariables: {
      '--primary-color': '#001970',
      '--secondary-color': '#001970',
      '--secondary-background-color': '#FBFBFB',
      '--main-max-width': '1310px',
      'font-size': '18px',
      '--midBlue-color': '#001970',
      '--hover-color': '#FFFFFF',
      '--icon-color': '#C3002F',
      '--secondary-icon-color': '#C3002F',
      '--option-card-hover-font-color': '#1D1C1E',
      '--footer-color': '#373737',
      '--active-border-color': '#FFD100',
      '--warning-background-color': '#F5E6C8',
      '--warning-text-color': '#6b5d00',
    },
  },
};

type ThemeReturnType = [ITheme, React.Dispatch<React.SetStateAction<ThemeName>>, any];

function generateMuiOverides(theme: ITheme) {
  const deepBlueColor = theme.primaryColor;
  const darkTerraCottaColor = theme.secondaryColor;
  const blackColor = '#2A2B2A';
  const midBlue = theme.midBlueColor;
  const lavenderColor = theme.hoverColor;

  return {
    palette: {
      primary: {
        main: deepBlueColor,
      },
      secondary: {
        main: darkTerraCottaColor,
      },
    },
    components: {
      // Name of the component
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        variants: [
          {
            props: { variant: 'contained' },
            style: {
              backgroundColor: deepBlueColor,
              border: '1px solid black',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontFamily: 'Open Sans',
              ':hover': {
                backgroundColor: lavenderColor,
                color: deepBlueColor,
              },
            },
          },
          {
            props: { variant: 'outlined' },
            style: {
              backgroundColor: 'transparent',
              color: midBlue,
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontFamily: 'Open Sans',
              ':hover': {
                backgroundColor: theme.outlineHoverBackgroundColor,
                color: theme.outlineHoverColor,
                border: 'none',
              },
            },
          },
        ],
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: blackColor,
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            '&.Mui-checked': {
              color: midBlue,
            },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            '&.Mui-checked': {
              color: deepBlueColor,
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: deepBlueColor,
            '&:hover': {
              color: darkTerraCottaColor,
            },
          },
        },
      },
    },
  };
}

export default function useStyle(initialStyle: ThemeName): ThemeReturnType {
  const [themeName, setTheme] = useState(initialStyle);

  const theme = themes[themeName];

  for (const [key, value] of Object.entries(theme.cssVariables)) {
    document.documentElement.style.setProperty(key, value);
  }

  const styleOverrides = generateMuiOverides(theme);

  return [theme, setTheme, styleOverrides];
}
