import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { formatShortDate } from '../../calendar/utils/dateUtils.js'

function PaymentChip({ status }) {
  return (
    <Chip
      label={status === 'paid' ? 'Paid' : 'Unpaid'}
      size="small"
      color={status === 'paid' ? 'success' : 'error'}
      variant="outlined"
      sx={{ fontWeight: 700 }}
    />
  )
}

export default function UpcomingRentals({ rentals }) {
  return (
    <Box component="section" sx={{ mt: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <PersonOutlineRoundedIcon color="primary" sx={{ fontSize: 20 }} />
        <Typography variant="h2">Upcoming rentals</Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none', overflow: 'auto', maxHeight: 142 }}>
        <Table size="small" stickyHeader sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Renter</TableCell><TableCell>Vehicle</TableCell><TableCell>From</TableCell>
              <TableCell>To</TableCell><TableCell>Contact</TableCell><TableCell>Paid</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rentals.map((rental) => (
              <TableRow key={rental.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{rental.renter.full_name}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{rental.vehicle.model}</Typography>
                  <Typography variant="caption" color="text.secondary">{rental.vehicle.license_plate}</Typography>
                </TableCell>
                <TableCell>{formatShortDate(rental.start_date)}</TableCell>
                <TableCell>{formatShortDate(rental.end_date)}</TableCell>
                <TableCell>
                  <Typography variant="body2">{rental.renter.phone}</Typography>
                  <Typography variant="caption" color="text.secondary">{rental.renter.email}</Typography>
                </TableCell>
                <TableCell><PaymentChip status={rental.payment_status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={1.25} sx={{ display: 'none' }}>
        {rentals.map((rental) => (
          <Card key={rental.id} sx={{ boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>{rental.renter.full_name}</Typography>
                  <Typography variant="body2" color="text.secondary">{rental.vehicle.model}</Typography>
                  <Typography variant="caption" color="text.secondary">{rental.vehicle.license_plate}</Typography>
                </Box>
                <PaymentChip status={rental.payment_status} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">From</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatShortDate(rental.start_date)}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">To</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatShortDate(rental.end_date)}</Typography></Box>
              </Box>
              <Typography variant="body2" sx={{ mt: 1.5 }}>{rental.renter.phone}</Typography>
              <Typography variant="caption" color="text.secondary">{rental.renter.email}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {rentals.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', boxShadow: 'none' }}>
          <Typography sx={{ fontWeight: 700 }}>No upcoming rentals</Typography>
          <Typography variant="body2" color="text.secondary">New bookings will appear here.</Typography>
        </Paper>
      )}
    </Box>
  )
}
