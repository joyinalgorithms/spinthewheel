import { extendTheme } from '@mui/joy/styles';

export const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#F0F5F1',
          100: '#DDE8D5',
          200: '#B1C5AB',
          300: '#8FA08B',
          400: '#7FA36B',
          500: '#3E5F44', // Main solid color
          600: '#345039',
          700: '#2A402D',
          800: '#1F2A20',
          900: '#141C16',
          solidBg: '#3E5F44',
          solidHoverBg: '#5E7B5A',
          solidActiveBg: '#2A402D',
          outlinedColor: '#3E5F44',
          outlinedBorder: '#DDE8D5',
          outlinedHoverBg: '#F0F5F1',
          outlinedActiveBg: '#DDE8D5',
          plainColor: '#3E5F44',
          plainHoverBg: '#F0F5F1',
          plainActiveBg: '#DDE8D5',
        },
        background: {
          body: '#F7F8F3', // Light, earthy warm backdrop
          surface: '#FFFFFF',
          level1: '#F0F2EB',
          level2: '#E3E8DD',
        },
        text: {
          primary: '#1F2A20', // Dark forest green charcoal
          secondary: '#4A5B4C',
          tertiary: '#768778',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          50: '#141C16',
          100: '#1F2A20',
          200: '#243126',
          300: '#3E5F44',
          400: '#5E7B5A',
          500: '#7FA36B', // Vibrant accent moss
          600: '#8FA08B',
          700: '#B1C5AB',
          800: '#DDE8D5',
          900: '#F7F8F3',
          solidBg: '#5E7B5A',
          solidHoverBg: '#7FA36B',
          solidActiveBg: '#3E5F44',
          outlinedColor: '#EBF2EA',
          outlinedBorder: '#243126',
          outlinedHoverBg: '#1C291F',
          outlinedActiveBg: '#243126',
          plainColor: '#EBF2EA',
          plainHoverBg: '#1C291F',
          plainActiveBg: '#243126',
        },
        background: {
          body: '#18221A', // Dark charcoal moss
          surface: '#243126', // Slightly lighter container green
          level1: '#1C291F',
          level2: '#162118',
        },
        text: {
          primary: '#EBF2EA', // Off-white moss
          secondary: '#A3B4A5',
          tertiary: '#708372',
        },
      },
    },
  },
  fontFamily: {
    body: '"Inter", var(--joy-fontFamily-fallback, sans-serif)',
    display: '"Space Grotesk", var(--joy-fontFamily-fallback, sans-serif)',
  },
  components: {
    JoyCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(31, 42, 32, 0.05)',
        },
      },
    },
    JoyButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          fontFamily: 'Space Grotesk',
          fontWeight: 600,
        },
      },
    },
  },
});
