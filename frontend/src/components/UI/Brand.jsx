import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import { Box, Typography } from '@mui/material'

export default function Brand({ compact = false }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <DirectionsCarRoundedIcon fontSize="small" />
      </Box>
      {!compact && (
        <Typography
          variant="h6"
          component="span"
          sx={{
            fontWeight: 950,
            lineHeight: 1,
            letterSpacing: 0,
            textTransform: 'uppercase',
            textShadow: '0 1px 0 rgba(255, 255, 255, 0.85), 0 0 4px rgba(8, 130, 83, 0.28)',
            whiteSpace: 'nowrap',
          }}
        >
          <Box component="span" sx={{ color: '#009b62', WebkitTextStroke: '0.45px #ffffff' }}>
            AUTO
          </Box>
          {' '}
          <Box component="span" sx={{ color: '#d81f2a', WebkitTextStroke: '0.45px #ffffff' }}>
            MILANO
          </Box>
        </Typography>
      )}
    </Box>
  )
}
