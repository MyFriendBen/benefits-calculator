import { useLayoutEffect, useMemo, useState } from 'react';

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
    // Colors - Primary & Secondary
    '--primary-color': string;
    '--secondary-color': string;
    '--midBlue-color': string;
    '--footer-color': string;

    // Colors - Background
    '--secondary-background-color': string;
    '--hover-color': string;

    // Colors - Icons
    '--icon-color': string;
    '--secondary-icon-color': string;

    // Colors - Interactive States
    '--option-card-hover-font-color': string;
    '--active-border-color': string;

    // Colors - Warnings (optional)
    '--warning-background-color'?: string;
    '--warning-text-color'?: string;

    // Typography
    '--font-heading': string;
    '--font-body': string;
    'font-size': string;

    // Layout
    '--main-max-width': string;
    '--content-max-width': string;
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
      // Colors - Primary & Secondary
      '--primary-color': '#293457',
      '--secondary-color': '#B85A27',
      '--midBlue-color': '#41528C',
      '--footer-color': '#41528C',

      // Colors - Background
      '--secondary-background-color': '#FBF9FC',
      '--hover-color': '#ECDEED',

      // Colors - Icons
      '--icon-color': '#D6743F',
      '--secondary-icon-color': '#D6743F',

      // Colors - Interactive States
      '--option-card-hover-font-color': '#1D1C1E',
      '--active-border-color': '#B85A27',

      // Typography
      '--font-heading': "'Roboto Slab', serif",
      '--font-body': "'Open Sans', sans-serif",
      'font-size': '18px',

      // Layout
      '--main-max-width': '1310px',
      '--content-max-width': '900px',
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
      // Colors - Primary & Secondary
      '--primary-color': '#005191',
      '--secondary-color': '#005191',
      '--midBlue-color': '#41528C',
      '--footer-color': '#ffffff',

      // Colors - Background
      '--secondary-background-color': '#F7F7F7',
      '--hover-color': '#EFEFEF',

      // Colors - Icons
      '--icon-color': '#ff443b',
      '--secondary-icon-color': '#005191',

      // Colors - Interactive States
      '--option-card-hover-font-color': '#1D1C1E',
      '--active-border-color': '#005191',

      // Typography
      '--font-heading': "'Roboto Slab', serif",
      '--font-body': "'Open Sans', sans-serif",
      'font-size': '18px',

      // Layout
      '--main-max-width': '1310px',
      '--content-max-width': '900px',
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
      // Colors - Primary & Secondary
      '--primary-color': '#21296B',
      '--secondary-color': '#21296B',
      '--midBlue-color': '#41528C',
      '--footer-color': '#ffffff',

      // Colors - Background
      '--secondary-background-color': '#F7F7F7',
      '--hover-color': '#FFFFFF',

      // Colors - Icons
      '--icon-color': '#ff443b',
      '--secondary-icon-color': '#21296B',

      // Colors - Interactive States
      '--option-card-hover-font-color': '#1D1C1E',
      '--active-border-color': '#21296B',

      // Typography
      '--font-heading': "'Roboto Slab', serif",
      '--font-body': "'Open Sans', sans-serif",
      'font-size': '18px',

      // Layout
      '--main-max-width': '1310px',
      '--content-max-width': '900px',
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
      // Colors - Primary & Secondary
      '--primary-color': '#003863',
      '--secondary-color': '#003863',
      '--midBlue-color': '#003863',
      '--footer-color': '#FFFFFF',

      // Colors - Background
      '--secondary-background-color': '#F7F7F7',
      '--hover-color': '#FFFFFF',

      // Colors - Icons
      '--icon-color': '#D6743F',
      '--secondary-icon-color': '#000000',

      // Colors - Interactive States
      '--option-card-hover-font-color': '#1D1C1E',
      '--active-border-color': '#8CCCF2',

      // Typography
      '--font-heading': "'Roboto Slab', serif",
      '--font-body': "'Open Sans', sans-serif",
      'font-size': '18px',

      // Layout
      '--main-max-width': '1310px',
      '--content-max-width': '900px',
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
      // Colors - Primary & Secondary
      '--primary-color': '#001970',
      '--secondary-color': '#001970',
      '--midBlue-color': '#001970',
      '--footer-color': '#373737',

      // Colors - Background
      '--secondary-background-color': '#FBFBFB',
      '--hover-color': '#FFFFFF',

      // Colors - Icons
      '--icon-color': '#C3002F',
      '--secondary-icon-color': '#C3002F',

      // Colors - Interactive States
      '--option-card-hover-font-color': '#1D1C1E',
      '--active-border-color': '#FFD100',

      // Colors - Warnings
      '--warning-background-color': '#F5E6C8',
      '--warning-text-color': '#6b5d00',

      // Typography
      '--font-heading': "'Roboto Slab', serif",
      '--font-body': "'Open Sans', sans-serif",
      'font-size': '18px',

      // Layout
      '--main-max-width': '1310px',
      '--content-max-width': '900px',
    },
  },
};

// Dynamically generate valid theme names from the themes object
export const VALID_THEMES = Object.keys(themes) as ThemeName[];

export const isValidTheme = (theme: string): theme is ThemeName => {
  return VALID_THEMES.includes(theme as ThemeName);
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
              fontFamily: 'var(--font-body)',
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
              fontFamily: 'var(--font-body)',
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
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
          },
          input: {
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
          },
        },
      },
    },
  };
}

export default function useStyle(initialStyle: ThemeName): ThemeReturnType {
  const [themeName, setTheme] = useState(initialStyle);

  const theme = themes[themeName];

  useLayoutEffect(() => {
    // Clear all custom properties to prevent stale vars when switching themes
    const style = document.documentElement.style;
    for (let i = style.length - 1; i >= 0; i--) {
      const prop = style[i];
      if (prop.startsWith('--')) {
        style.removeProperty(prop);
      }
    }

    for (const [key, value] of Object.entries(theme.cssVariables)) {
      style.setProperty(key, value);
    }
  }, [themeName]);

  const styleOverrides = useMemo(() => generateMuiOverides(theme), [themeName]);

  return [theme, setTheme, styleOverrides];
}
