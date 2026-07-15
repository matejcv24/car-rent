import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
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
      sx={{ width: 62, fontWeight: 700 }}
    />
  )
}

function getPhoneHref(phone) {
  const normalizedPhone = String(phone ?? '').replace(/[^\d+]/g, '')
  return normalizedPhone ? `tel:${normalizedPhone}` : undefined
}

function PhoneLink({ phone, sx }) {
  return (
    <Typography
      component="a"
      href={getPhoneHref(phone)}
      variant="body2"
      sx={{
        color: '#00008B',
        display: 'inline-block',
        fontWeight: 700,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
        ...sx,
      }}
    >
      {phone}
    </Typography>
  )
}

export default function UpcomingRentals({ rentals, onEditRental, onDeleteRental }) {
  return (
    <Box component="section" sx={{ mt: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <PersonOutlineRoundedIcon color="primary" sx={{ fontSize: 20 }} />
        <Typography variant="h2">Rentals</Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none', overflow: 'auto', maxHeight: 320 }}>
        <Table size="small" stickyHeader sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell>Vehicle</TableCell><TableCell>Renter</TableCell><TableCell align="center">From</TableCell>
              <TableCell align="center">To</TableCell><TableCell align="center">Contact</TableCell><TableCell align="center">Paid</TableCell><TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rentals.map((rental) => (
              <TableRow key={rental.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{rental.vehicle.model}</Typography>
                  <Typography variant="caption" color="text.secondary">{rental.vehicle.license_plate}</Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{rental.renter.full_name}</TableCell>
                <TableCell align="center">{formatShortDate(rental.start_date)}</TableCell>
                <TableCell align="center">{formatShortDate(rental.end_date)}</TableCell>
                <TableCell align="center">
                  <PhoneLink phone={rental.renter.phone} />
                  <Typography variant="caption" color="text.secondary">{rental.renter.email}</Typography>
                </TableCell>
                <TableCell align="center">
                  <PaymentChip status={rental.payment_status} />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip title="Edit rental">
                      <IconButton size="small" aria-label={`Edit rental for ${rental.renter.full_name}`} onClick={() => onEditRental(rental)} sx={{ width: 28, height: 28, color: '#0096FF' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete rental">
                      <IconButton size="small" color="error" aria-label={`Delete rental for ${rental.renter.full_name}`} onClick={() => onDeleteRental(rental)} sx={{ width: 28, height: 28 }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PaymentChip status={rental.payment_status} />
                  <IconButton size="small" aria-label={`Edit rental for ${rental.renter.full_name}`} onClick={() => onEditRental(rental)} sx={{ color: '#0096FF' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" aria-label={`Delete rental for ${rental.renter.full_name}`} onClick={() => onDeleteRental(rental)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">From</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatShortDate(rental.start_date)}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">To</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatShortDate(rental.end_date)}</Typography></Box>
              </Box>
              <PhoneLink phone={rental.renter.phone} sx={{ mt: 1.5 }} />
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
