import { createTheme } from '@mui/material/styles'

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0a9f76', dark: '#087b5d', light: '#d9f4ea', contrastText: '#fff' },
    secondary: { main: '#27332e' },
    background: { default: '#f5f7f6', paper: '#fff' },
    text: { primary: '#17211d', secondary: '#64716b' },
    divider: '#dfe5e2',
    success: { main: '#4e8a3d', light: '#e4f2dc' },
    warning: { main: '#b7791f', light: '#fff0ce' },
    error: { main: '#cf4c4c', light: '#fde4e4' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontSize: 'clamp(1.75rem, 6vw, 2.5rem)', fontWeight: 750, letterSpacing: '-0.035em' },
    h2: { fontSize: '1.25rem', fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 44, borderRadius: 10 } },
    },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #dfe5e2', boxShadow: '0 16px 40px rgba(23, 33, 29, 0.08)' },
      },
    },
  },
})

export default muiTheme
