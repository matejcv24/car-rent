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
        <Typography variant="h6" component="span" sx={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
          FleetTrack
        </Typography>
      )}
    </Box>
  )
}
