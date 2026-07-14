import { Box, Typography } from '@mui/material'

const colors = [
  { bg: '#d8f2e8', text: '#195b48' },
  { bg: '#ffe3d7', text: '#81422c' },
  { bg: '#dce8ff', text: '#31558f' },
  { bg: '#ffedbd', text: '#795a14' },
  { bg: '#f3d9ff', text: '#66317d' },
  { bg: '#d9f0ff', text: '#205a78' },
  { bg: '#e5f8c8', text: '#48651c' },
  { bg: '#ffd9e4', text: '#7a2e48' },
  { bg: '#e7e0ff', text: '#4c3d8a' },
  { bg: '#d4f6f4', text: '#1f625e' },
  { bg: '#ffe7b8', text: '#725018' },
  { bg: '#dff0d2', text: '#42642d' },
  { bg: '#ffd8cc', text: '#7b3a27' },
  { bg: '#d7e4f7', text: '#2f4f78' },
  { bg: '#f7dfef', text: '#74375f' },
  { bg: '#d9f4df', text: '#2e693c' },
  { bg: '#f1e3c2', text: '#67501d' },
  { bg: '#d8ecf0', text: '#2c626b' },
  { bg: '#fde0d0', text: '#7a4428' },
  { bg: '#e0e8cc', text: '#52612a' },
  { bg: '#f2dcff', text: '#623982' },
  { bg: '#cfeee6', text: '#245e51' },
  { bg: '#ffe0f0', text: '#783054' },
  { bg: '#e8e3c8', text: '#655a25' },
  { bg: '#d6e9ff', text: '#2d5788' },
  { bg: '#f4e0d8', text: '#704330' },
  { bg: '#dff3ff', text: '#2b657e' },
  { bg: '#ecf0cc', text: '#5b6329' },
  { bg: '#ffd6d9', text: '#7a3035' },
  { bg: '#dce2ff', text: '#3c4b8f' },
]

function getColorIndex(value) {
  const text = String(value ?? '')
  let hash = 0

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % colors.length
  }

  return hash
}

export default function RentalPill({ rental }) {
  const renterColorKey = rental.renter?.id ?? rental.renter?.name ?? rental.id
  const color = colors[getColorIndex(renterColorKey)]
  const nameParts = String(rental.renter.name ?? '').trim().split(/\s+/).filter(Boolean)
  const firstName = nameParts[0] ?? ''
  const surname = nameParts.slice(1).join(' ')

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        minWidth: 0,
        px: 0.75,
        py: 0.55,
        borderRadius: 1.5,
        bgcolor: color.bg,
        color: color.text,
        textAlign: 'center',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 750, lineHeight: 1.05 }}>
        {firstName || rental.renter.name}
      </Typography>
      {surname && (
        <Typography variant="caption" sx={{ fontWeight: 750, lineHeight: 1.05 }}>
          {surname}
        </Typography>
      )}
    </Box>
  )
}
