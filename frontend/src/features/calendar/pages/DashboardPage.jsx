import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Alert, Box, Button, Dialog, DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel, MenuItem, Select, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import api, { getApiErrors, getApiMessage } from '../../../config/api.js'
import UpcomingRentals from '../../rentals/components/UpcomingRentals.jsx'
import WeeklyCalendar from '../components/WeeklyCalendar.jsx'
import useDashboardData from '../hooks/useDashboardData.js'

function formatDateDisplay(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export default function DashboardPage() {
  const dashboard = useDashboardData()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [datePickerField, setDatePickerField] = useState('startDate')
  const [datePickerValue, setDatePickerValue] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
  const [vehiclesError, setVehiclesError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [renterForm, setRenterForm] = useState({
    vehicle: '',
    name: '',
    phone: '',
    email: '',
    startDate: '',
    endDate: '',
    paidStatus: '',
  })

  const updateField = (field, value) => {
    setRenterForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const resetRentalForm = () => {
    setRenterForm({
      vehicle: '',
      name: '',
      phone: '',
      email: '',
      startDate: '',
      endDate: '',
      paidStatus: '',
    })
    setSaveError('')
    setFieldErrors({})
  }

  const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const openRentalDialog = () => {
    blurActiveElement()
    resetRentalForm()
    setIsDialogOpen(true)
    fetchVehicles()
  }

  const closeRentalDialog = () => {
    blurActiveElement()
    setIsDialogOpen(false)
    resetRentalForm()
  }

  const fetchVehicles = async () => {
    setVehiclesError('')
    setIsLoadingVehicles(true)

    try {
      const response = await api.get('/vehicles', { params: { limit: 100 } })
      setVehicles(response.data.data ?? [])
    } catch (error) {
      setVehiclesError(getApiMessage(error, 'Failed to load vehicles. Please try again.'))
    } finally {
      setIsLoadingVehicles(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const canSaveRental = Boolean(
    renterForm.vehicle &&
      renterForm.name.trim() &&
      renterForm.phone.trim() &&
      renterForm.startDate &&
      renterForm.endDate,
  )

  const handleSaveRental = async () => {
    setSaveError('')
    setFieldErrors({})

    if (!canSaveRental) {
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        vehicle_id: parseInt(renterForm.vehicle),
        start_date: renterForm.startDate,
        end_date: renterForm.endDate,
        total_price: 100,
        renter: {
          first_name: renterForm.name.trim(),
          last_name: '',
          phone: renterForm.phone.trim(),
          email: renterForm.email.trim(),
        },
      }

      if (renterForm.paidStatus) {
        payload.payment_status = renterForm.paidStatus === 'paid' ? 'paid' : 'unpaid'
      }

      await api.post('/rentals', payload)

      setIsDialogOpen(false)
      resetRentalForm()
      dashboard.retry()
    } catch (error) {
      const errors = getApiErrors(error)
      const vehicleError = errors.vehicle_id?.[0]

      setFieldErrors({
        vehicle: vehicleError,
        name: errors['renter.first_name']?.[0],
        phone: errors['renter.phone']?.[0],
        email: errors['renter.email']?.[0],
        startDate: errors.start_date?.[0],
        endDate: errors.end_date?.[0],
        paidStatus: errors.payment_status?.[0],
      })
      setSaveError(vehicleError ? '' : getApiMessage(error, 'Failed to save rental. Please try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  const openDatePicker = (field) => {
    blurActiveElement()

    setDatePickerField(field)
    const selectedDate = renterForm[field] ? dayjs(renterForm[field]) : dayjs()
    setDatePickerValue(selectedDate)
    setDatePickerOpen(true)
  }

  const closeDatePicker = () => setDatePickerOpen(false)

  const selectDate = (date) => {
    const iso = date.format('YYYY-MM-DD')
    updateField(datePickerField, iso)
    closeDatePicker()
  }


  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddRoundedIcon />}
          fullWidth
          sx={{ width: { xs: '100%', sm: 'auto' }, color: 'common.white' }}
          onClick={openRentalDialog}
        >
          Add rental
        </Button>
      </Box>

      {dashboard.error && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={dashboard.retry}>Retry</Button>} sx={{ mb: 2 }}>
          {dashboard.error}
        </Alert>
      )}

      {dashboard.isLoading && !dashboard.calendar ? (
        <Skeleton variant="rounded" height={420} />
      ) : dashboard.calendar ? (
        <WeeklyCalendar
          calendar={dashboard.calendar}
          onPrevious={dashboard.previousWeek}
          onToday={dashboard.currentWeek}
          onNext={dashboard.nextWeek}
        />
      ) : null}

      <Dialog
        open={isDialogOpen}
        onClose={closeRentalDialog}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: { m: { xs: 1, sm: 4 } },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
          New rental
          <IconButton onClick={closeRentalDialog} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          <Stack spacing={{ xs: 1.5, sm: 2.25 }}>
            {vehiclesError && (
              <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchVehicles}>Retry</Button>}>
                {vehiclesError}
              </Alert>
            )}

            <FormControl fullWidth required disabled={isLoadingVehicles || isSaving} error={Boolean(fieldErrors.vehicle)}>
              <InputLabel id="rental-vehicle-label">Vehicle</InputLabel>
              <Select
                labelId="rental-vehicle-label"
                label="Vehicle"
                value={renterForm.vehicle}
                onChange={(event) => updateField('vehicle', event.target.value)}
              >
                {isLoadingVehicles && (
                  <MenuItem value="" disabled>Loading vehicles...</MenuItem>
                )}
                {!isLoadingVehicles && vehicles.length === 0 && (
                  <MenuItem value="" disabled>No vehicles created yet</MenuItem>
                )}
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.model} - {vehicle.license_plate}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.vehicle && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {fieldErrors.vehicle}
                </Typography>
              )}
            </FormControl>

            <Box>
              <Typography variant="overline" sx={{ display: 'block', mb: 0.5, letterSpacing: '0.12em', color: 'text.secondary' }}>
                Renter details
              </Typography>
              <Stack spacing={{ xs: 1.25, sm: 2 }}>
                <TextField
                  label="Name and Surname"
                  placeholder="John Doe"
                  fullWidth
                  required
                  name="rental-customer-display"
                  autoComplete="new-password"
                  value={renterForm.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  error={Boolean(fieldErrors.name)}
                  helperText={fieldErrors.name}
                  slotProps={{
                    htmlInput: {
                      autoComplete: 'new-password',
                    },
                  }}
                />
                <TextField
                  label="Mobile phone"
                  placeholder="+389 70 123 456"
                  fullWidth
                  required
                  name="rental-contact-number"
                  autoComplete="new-password"
                  value={renterForm.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  error={Boolean(fieldErrors.phone)}
                  helperText={fieldErrors.phone}
                  slotProps={{
                    htmlInput: {
                      autoComplete: 'new-password',
                    },
                  }}
                />
                <TextField
                  label="Email address"
                  placeholder="name@example.com"
                  fullWidth
                  name="rental-contact-note"
                  autoComplete="new-password"
                  value={renterForm.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                  slotProps={{
                    htmlInput: {
                      autoComplete: 'new-password',
                    },
                  }}
                />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" sx={{ display: 'block', mb: 0.5, letterSpacing: '0.12em', color: 'text.secondary' }}>
                Rental dates
              </Typography>
              <Stack spacing={{ xs: 1.25, sm: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    label="Start date"
                    type="text"
                    fullWidth
                    required
                    value={formatDateDisplay(renterForm.startDate)}
                    placeholder="Start date"
                    error={Boolean(fieldErrors.startDate)}
                    helperText={fieldErrors.startDate}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                  <IconButton
                    onClick={() => openDatePicker('startDate')}
                    sx={{
                      position: 'absolute',
                      right: 14,
                      top: fieldErrors.startDate ? '37%' : '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                    }}
                    edge="end"
                  >
                    <CalendarTodayRoundedIcon />
                  </IconButton>
                </Box>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    label="End date"
                    type="text"
                    fullWidth
                    required
                    value={formatDateDisplay(renterForm.endDate)}
                    placeholder="End date"
                    error={Boolean(fieldErrors.endDate)}
                    helperText={fieldErrors.endDate}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                  <IconButton
                    onClick={() => openDatePicker('endDate')}
                    sx={{
                      position: 'absolute',
                      right: 14,
                      top: fieldErrors.endDate ? '37%' : '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                    }}
                    edge="end"
                  >
                    <CalendarTodayRoundedIcon />
                  </IconButton>
                </Box>
              </Stack>
            </Box>

            <FormControl fullWidth error={Boolean(fieldErrors.paidStatus)}>
              <InputLabel>Payment status</InputLabel>
              <Select
                value={renterForm.paidStatus}
                onChange={(e) => updateField('paidStatus', e.target.value)}
                label="Payment status"
              >
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
              {fieldErrors.paidStatus && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {fieldErrors.paidStatus}
                </Typography>
              )}
            </FormControl>
          </Stack>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, px: { xs: 2, sm: 3 }, py: { xs: 1.25, sm: 2 }, borderTop: 1, borderColor: 'divider' }}>
          <Button
            onClick={handleSaveRental}
            variant="contained"
            color="primary"
            sx={{ color: 'common.white', flex: 1 }}
            disabled={isSaving || !canSaveRental}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={closeRentalDialog} variant="outlined" sx={{ flex: 1 }} disabled={isSaving}>
            Cancel
          </Button>
        </Box>
      </Dialog>

      <Dialog open={datePickerOpen} onClose={closeDatePicker} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box component="span" sx={{ fontWeight: 700 }}>Select date</Box>
          <IconButton onClick={closeDatePicker} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={datePickerValue}
              onChange={(newValue) => selectDate(newValue)}
            />
          </LocalizationProvider>
        </DialogContent>
      </Dialog>

      {dashboard.isLoading && !dashboard.summary ? (
        <Skeleton variant="rounded" height={260} sx={{ mt: 3 }} />
      ) : (
        <UpcomingRentals rentals={dashboard.summary?.upcoming_rentals ?? []} />
      )}
    </Box>
  )
}
