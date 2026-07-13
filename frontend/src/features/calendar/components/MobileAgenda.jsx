import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import KeyboardReturnRoundedIcon from '@mui/icons-material/KeyboardReturnRounded'
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { formatShortDate } from '../utils/dateUtils.js'

function includesDate(range, date) {
  return range && range.start_date <= date && range.end_date >= date
}

export default function MobileAgenda({ calendar }) {
  const initialDay = calendar.days.find((day) => day.is_today)?.date ?? calendar.days[0]?.date
  const [selectedDay, setSelectedDay] = useState(initialDay)
  const events = calendar.vehicles.flatMap((vehicle) =>
    vehicle.rentals
      .filter((rental) => includesDate(rental.visible_booking, selectedDay) || rental.return_marker?.date === selectedDay)
      .map((rental) => ({
        vehicle,
        rental,
        isBooking: includesDate(rental.visible_booking, selectedDay),
        isReturn: rental.return_marker?.date === selectedDay,
      })),
  )

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(4, minmax(0, 1fr))', sm: 'repeat(7, minmax(0, 1fr))' }, gap: 1.25, pb: 1.5 }}>
        {calendar.days.map((day) => (
          <Button
            key={day.date}
            variant={selectedDay === day.date ? 'contained' : 'outlined'}
            onClick={() => setSelectedDay(day.date)}
            sx={{ minHeight: 72, minWidth: 0, px: 1.25, display: 'grid', lineHeight: 1.1 }}
          >
            <Typography variant="caption" component="span" sx={{ fontWeight: 800 }}>{day.day_name}</Typography>
            <Typography component="span" sx={{ fontWeight: 800 }}>{day.day_number}</Typography>
          </Button>
        ))}
      </Box>

      <Typography variant="h2" sx={{ mt: 1, mb: 1.5 }}>{formatShortDate(selectedDay)}</Typography>
      <Stack spacing={1.25}>
        {events.map(({ vehicle, rental, isBooking, isReturn }) => (
          <Card key={`${vehicle.id}-${rental.id}`} sx={{ boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.dark', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <DirectionsCarRoundedIcon fontSize="small" />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 800 }}>{vehicle.license_plate}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>{vehicle.model}</Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>{rental.renter.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatShortDate(rental.start_date)} – {formatShortDate(rental.end_date)}
                  </Typography>
                </Box>
                <Stack spacing={0.75} alignItems="flex-end">
                  {isBooking && <Chip label="Rented" size="small" color="primary" variant="outlined" />}
                  {isReturn && <Chip icon={<KeyboardReturnRoundedIcon />} label="Return" size="small" color="warning" />}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        ))}
        {events.length === 0 && (
          <Card sx={{ boxShadow: 'none' }}>
            <CardContent sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 700 }}>No rentals for this day</Typography>
              <Typography variant="body2" color="text.secondary">Every vehicle is free on the selected date.</Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  )
}
