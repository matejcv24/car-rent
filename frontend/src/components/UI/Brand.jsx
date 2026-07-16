import { Box, Typography } from '@mui/material'

export default function Brand({ compact = false }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.4 }, minWidth: 0 }}>
      {!compact && (
        <Typography
          variant="h6"
          component="span"
          sx={{
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: 0,
            fontSize: { xs: 20, sm: 26 },
            whiteSpace: 'nowrap',
          }}
        >
          <Box component="span" sx={{ color: '#02b84d' }}>
            Domino
          </Box>
          {' '}
          <Box component="span" sx={{ color: '#111' }}>
            Team
          </Box>
          {' '}
          <Box component="span" sx={{ color: '#e1192d' }}>
            Car
          </Box>
        </Typography>
      )}
    </Box>
  )
}
