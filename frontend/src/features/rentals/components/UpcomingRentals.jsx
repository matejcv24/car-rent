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
import { useEffect, useRef } from 'react'
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
        whiteSpace: 'nowrap',
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

function RenterName({ renter }) {
  const firstName = String(renter.first_name ?? '').trim()
  const lastName = String(renter.last_name ?? '').trim()
  const fallbackName = String(renter.full_name ?? '').trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || fallbackName

  return (
    <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
      {fullName}
    </Box>
  )
}

export default function UpcomingRentals({ rentals, onEditRental, onDeleteRental }) {
  const tableScrollRef = useRef(null)
  const touchScrollRef = useRef({
    axis: null,
    scrollLeft: 0,
    scrollTop: 0,
    startX: 0,
    startY: 0,
  })

  const handleTableTouchStart = (event) => {
    const touch = event.touches[0]
    const scrollElement = tableScrollRef.current

    if (!touch || !scrollElement) return

    touchScrollRef.current = {
      axis: null,
      scrollLeft: scrollElement.scrollLeft,
      scrollTop: scrollElement.scrollTop,
      startX: touch.clientX,
      startY: touch.clientY,
    }
  }

  const handleTableTouchMove = (event) => {
    const touch = event.touches[0]
    const scrollElement = tableScrollRef.current

    if (!touch || !scrollElement) return

    const state = touchScrollRef.current
    const deltaX = state.startX - touch.clientX
    const deltaY = state.startY - touch.clientY
    const absoluteDeltaX = Math.abs(deltaX)
    const absoluteDeltaY = Math.abs(deltaY)

    if (!state.axis && (absoluteDeltaX > 6 || absoluteDeltaY > 6)) {
      state.axis = absoluteDeltaX > absoluteDeltaY ? 'x' : 'y'
    }

    if (state.axis === 'x') {
      event.preventDefault()

      const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth
      scrollElement.scrollLeft = Math.min(Math.max(state.scrollLeft + deltaX, 0), maxScrollLeft)
      scrollElement.scrollTop = state.scrollTop
    }

    if (state.axis === 'y') {
      event.preventDefault()

      const maxScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight
      scrollElement.scrollTop = Math.min(Math.max(state.scrollTop + deltaY, 0), maxScrollTop)
      scrollElement.scrollLeft = state.scrollLeft
    }
  }

  const handleTableTouchEnd = () => {
    touchScrollRef.current.axis = null
  }

  useEffect(() => {
    const scrollElement = tableScrollRef.current

    if (!scrollElement) return undefined

    scrollElement.addEventListener('touchmove', handleTableTouchMove, { passive: false })

    return () => {
      scrollElement.removeEventListener('touchmove', handleTableTouchMove)
    }
  })

  return (
    <Box component="section" sx={{ mt: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <PersonOutlineRoundedIcon color="primary" sx={{ fontSize: 20 }} />
        <Typography variant="h2">Rentals</Typography>
      </Box>

      <TableContainer
        ref={tableScrollRef}
        component={Paper}
        variant="outlined"
        onTouchStart={handleTableTouchStart}
        onTouchEnd={handleTableTouchEnd}
        onTouchCancel={handleTableTouchEnd}
        sx={{
          boxShadow: 'none',
          maxHeight: 320,
          maxWidth: '100%',
          overflow: 'auto',
          overscrollBehavior: 'contain',
          overscrollBehaviorX: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Table size="small" stickyHeader sx={{ minWidth: 820 }}>
          <TableHead>
            <TableRow>
              <TableCell>Vehicle</TableCell><TableCell align="center">Renter</TableCell><TableCell align="center">From</TableCell>
              <TableCell align="center">To</TableCell><TableCell align="center">Contact</TableCell><TableCell align="center">Paid</TableCell><TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rentals.map((rental) => (
              <TableRow key={rental.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{rental.vehicle.model}</Typography>
                  <Typography variant="caption" color="text.secondary">{rental.vehicle.license_plate}</Typography>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  <RenterName renter={rental.renter} />
                </TableCell>
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
