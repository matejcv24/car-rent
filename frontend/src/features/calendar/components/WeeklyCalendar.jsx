import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import { Box, Button, ButtonGroup, FormControl, MenuItem, Paper, Select, Typography } from '@mui/material'
import { useState } from 'react'
import RentalPill from './RentalPill.jsx'
import { formatWeekLabel } from '../utils/dateUtils.js'

function includesDate(range, date) {
  return range && range.start_date <= date && range.end_date >= date
}

export default function WeeklyCalendar({ calendar, onPrevious, onToday, onNext }) {
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all')
  const vehicleColumnWidth = 116
  const dateColumnWidth = 86
  const calendarColumns = `${vehicleColumnWidth}px repeat(7, ${dateColumnWidth}px)`
  const gridWidth = vehicleColumnWidth + (dateColumnWidth * 7)
  const rowHeight = 76
  const headerHeight = 62
  const visibleVehicles = vehicleTypeFilter === 'all'
    ? calendar.vehicles
    : calendar.vehicles.filter((vehicle) => vehicle.type === vehicleTypeFilter)

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', boxShadow: 'none' }}>
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, display: 'flex', flexDirection: 'column', gap: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1.5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {formatWeekLabel(calendar.start_date, calendar.end_date)}
            </Typography>
          </Box>
          <Box sx={{ width: '100%' }}>
            <ButtonGroup size="small" variant="contained" fullWidth>
              <Button onClick={onPrevious} color="primary" startIcon={<ArrowBackIosIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', color: 'common.white' }}>
                Prev
              </Button>
              <Button onClick={onToday} color="primary" sx={{ textTransform: 'none', color: 'common.white' }}>
                Today
              </Button>
              <Button onClick={onNext} color="primary" endIcon={<ArrowForwardIosIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', color: 'common.white' }}>
                Next
              </Button>
            </ButtonGroup>
          </Box>
        </Box>
      </Box>

      <Box sx={{ width: '100%', overflowX: 'auto', overflowY: 'visible' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: calendarColumns, bgcolor: '#f7f9f8', width: gridWidth, position: 'sticky', top: 0, zIndex: 4 }}>
          <Box sx={{ px: 0.8, py: 1, minHeight: headerHeight, borderRight: 1, borderBottom: 1, borderColor: 'divider', position: 'sticky', left: 0, zIndex: 5, bgcolor: '#f7f9f8' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                Vehicle
              </Typography>
              <FormControl size="small" variant="standard" sx={{ minWidth: 24 }}>
                <Select
                  value={vehicleTypeFilter}
                  onChange={(event) => setVehicleTypeFilter(event.target.value)}
                  disableUnderline
                  renderValue={() => ''}
                  sx={{
                    '& .MuiSelect-select': { p: 0, minHeight: 'auto', width: 0, color: 'transparent' },
                    '& .MuiSelect-icon': { right: 0, color: 'text.secondary' },
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="car">Cars</MenuItem>
                  <MenuItem value="van">Vans</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          {calendar.days.map((day) => (
            <Box key={day.date} sx={{ px: 0.6, py: 1, minHeight: headerHeight, textAlign: 'center', borderRight: 1, borderBottom: 1, borderColor: 'divider', bgcolor: day.is_today ? 'primary.light' : 'transparent' }}>
              <Typography variant="caption" color={day.is_today ? 'primary.dark' : 'text.secondary'} sx={{ fontWeight: 800 }}>
                {day.day_name}
              </Typography>
              <Typography sx={{ fontWeight: 800 }}>{day.day_number}</Typography>
            </Box>
          ))}
        </Box>

        {visibleVehicles.map((vehicle) => (
          <Box key={vehicle.id} sx={{ display: 'grid', gridTemplateColumns: calendarColumns, width: gridWidth }}>
            <Box sx={{ px: 0.8, py: 1, height: rowHeight, borderRight: 1, borderBottom: 1, borderColor: 'divider', position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper' }}>
              <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>{vehicle.model}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{vehicle.license_plate}</Typography>
            </Box>
            {calendar.days.map((day) => {
              const bookings = vehicle.rentals.filter((rental) => includesDate(rental.visible_booking, day.date))
              const returns = vehicle.rentals.filter((rental) => rental.return_marker?.date === day.date)
              return (
                <Box key={day.date} sx={{ display: 'grid', alignContent: 'center', gap: 0.5, p: 0.4, height: rowHeight, borderRight: 1, borderBottom: 1, borderColor: 'divider', bgcolor: day.is_today ? 'rgba(10, 159, 118, 0.035)' : 'transparent' }}>
                  {returns.map((rental) => <RentalPill key={`return-${rental.id}`} rental={rental} />)}
                  {bookings.map((rental) => <RentalPill key={rental.id} rental={rental} />)}
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>
    </Paper>
  )
}
