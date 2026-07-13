import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import api, { getApiErrors, getApiMessage } from '../../../config/api.js'

const initialVehicleForm = {
  licensePlate: '',
  model: '',
  type: 'car',
  registrationStartDate: '',
  registrationExpiryDate: '',
}

function formatDateDisplay(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function VehicleCard({ vehicle, isSelected, onSelect, onEdit, onHistory }) {
  return (
    <Card
      onClick={onSelect}
      data-active={isSelected ? '' : undefined}
      sx={{
        aspectRatio: '1 / 1',
        minHeight: 150,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        '&[data-active]': {
          backgroundColor: 'action.selected',
          '&:hover': {
            backgroundColor: 'action.selectedHover',
          },
        },
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          p: { xs: 1.25, sm: 2 },
          pb: { xs: 0.75, sm: 1 },
        }}
      >
        <Typography variant="h2" component="div" sx={{ mb: 0.5, fontSize: { xs: 16, sm: 20 } }}>
          {vehicle.model}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: { xs: 1, sm: 2 }, fontSize: { xs: 12, sm: 14 } }}>
          {vehicle.license_plate}
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body2" sx={{ fontSize: { xs: 11, sm: 14 } }}>
            Type: {vehicle.type === 'van' ? 'Van' : 'Car'}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: 11, sm: 14 } }}>
            Registration from: {formatDateDisplay(vehicle.registration?.start_date)}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: 11, sm: 14 } }}>
            Registration to: {formatDateDisplay(vehicle.registration?.expiry_date)}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions
        onClick={(event) => event.stopPropagation()}
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          p: { xs: 1, sm: 1.5 },
          pt: 0,
        }}
      >
        <Button variant="outlined" size="small" onClick={onEdit} sx={{ minWidth: 0 }}>
          Edit
        </Button>
        <Button variant="outlined" size="small" onClick={onHistory} sx={{ minWidth: 0 }}>
          History
        </Button>
      </CardActions>
    </Card>
  )
}

function VehicleSection({ title, vehicles, selectedVehicleId, onSelectVehicle, onEditVehicle, onShowHistory }) {
  return (
    <Box>
      <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 900 }}>
        {title}
      </Typography>
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: { xs: 1.25, sm: 2 },
          mt: 1,
        }}
      >
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            isSelected={selectedVehicleId === vehicle.id}
            onSelect={() => onSelectVehicle(vehicle.id)}
            onEdit={() => onEditVehicle(vehicle)}
            onHistory={() => onShowHistory(vehicle)}
          />
        ))}
      </Box>
    </Box>
  )
}

export default function VehiclesPage() {
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [historyVehicle, setHistoryVehicle] = useState(null)
  const [historyRentals, setHistoryRentals] = useState([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [datePickerField, setDatePickerField] = useState('registrationStartDate')
  const [datePickerValue, setDatePickerValue] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm)
  const [vehicles, setVehicles] = useState([])
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true)
  const [vehiclesError, setVehiclesError] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)

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

  const updateField = (field, value) => {
    setVehicleForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const closeAddVehicle = () => {
    if (isSaving) return
    blurActiveElement()
    setIsAddVehicleOpen(false)
  }

  const resetVehicleForm = () => {
    setVehicleForm(initialVehicleForm)
    setSaveError('')
    setFieldErrors({})
  }

  const openAddVehicle = () => {
    blurActiveElement()
    setEditingVehicle(null)
    resetVehicleForm()
    setIsAddVehicleOpen(true)
  }

  const openEditVehicle = (vehicle) => {
    blurActiveElement()
    setEditingVehicle(vehicle)
    setVehicleForm({
      licensePlate: vehicle.license_plate ?? '',
      model: vehicle.model ?? '',
      type: vehicle.type ?? 'car',
      registrationStartDate: vehicle.registration?.start_date ?? '',
      registrationExpiryDate: vehicle.registration?.expiry_date ?? '',
    })
    setSaveError('')
    setFieldErrors({})
    setIsAddVehicleOpen(true)
  }

  const openHistory = async (vehicle) => {
    setHistoryVehicle(vehicle)
    setHistoryRentals([])
    setHistoryError('')
    setIsHistoryLoading(true)

    try {
      const response = await api.get('/rentals', { params: { vehicle_id: vehicle.id, limit: 100 } })
      setHistoryRentals(response.data.data ?? [])
    } catch (error) {
      setHistoryError(getApiMessage(error, 'Failed to load rental history. Please try again.'))
    } finally {
      setIsHistoryLoading(false)
    }
  }

  const closeHistory = () => {
    setHistoryVehicle(null)
    setHistoryRentals([])
    setHistoryError('')
  }

  const openDatePicker = (field) => {
    blurActiveElement()

    setDatePickerField(field)
    const selectedDate = vehicleForm[field] ? dayjs(vehicleForm[field]) : dayjs()
    setDatePickerValue(selectedDate)
    setDatePickerOpen(true)
  }

  const closeDatePicker = () => setDatePickerOpen(false)

  const selectDate = (date) => {
    const iso = date.format('YYYY-MM-DD')
    updateField(datePickerField, iso)
    closeDatePicker()
  }

  const canSaveVehicle = Boolean(
    vehicleForm.model.trim() &&
      vehicleForm.licensePlate.trim() &&
      vehicleForm.type,
  )

  const handleSaveVehicle = async () => {
    setSaveError('')
    setFieldErrors({})

    if (!canSaveVehicle) {
      return
    }

    setIsSaving(true)

    try {
      const vehiclePayload = {
        license_plate: vehicleForm.licensePlate.trim(),
        model: vehicleForm.model.trim(),
        type: vehicleForm.type,
      }
      const registrationPayload = {
        registration_number: vehicleForm.licensePlate,
        start_date: vehicleForm.registrationStartDate,
        expiry_date: vehicleForm.registrationExpiryDate,
      }

      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, vehiclePayload)

        const registrationChanged =
          editingVehicle.registration?.registration_number !== registrationPayload.registration_number ||
          editingVehicle.registration?.start_date !== registrationPayload.start_date ||
          editingVehicle.registration?.expiry_date !== registrationPayload.expiry_date

        if (registrationPayload.start_date && registrationPayload.expiry_date && registrationChanged) {
          await api.post(`/vehicles/${editingVehicle.id}/registrations`, registrationPayload)
        }
      } else {
        const payload = { ...vehiclePayload }

        if (registrationPayload.start_date && registrationPayload.expiry_date) {
          payload.registration = registrationPayload
        }

        await api.post('/vehicles', payload)
      }

      resetVehicleForm()
      setEditingVehicle(null)
      setIsAddVehicleOpen(false)
      fetchVehicles()
    } catch (error) {
      const errors = getApiErrors(error)

      setFieldErrors({
        licensePlate: errors.license_plate?.[0] ?? errors['registration.registration_number']?.[0] ?? errors.registration_number?.[0],
        model: errors.model?.[0],
        type: errors.type?.[0],
        registrationStartDate: errors['registration.start_date']?.[0] ?? errors.start_date?.[0],
        registrationExpiryDate: errors['registration.expiry_date']?.[0] ?? errors.expiry_date?.[0],
      })
      setSaveError(getApiMessage(error, 'Failed to save vehicle. Please try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseVehicleModal = () => {
    closeAddVehicle()
    if (!isSaving) {
      setEditingVehicle(null)
      resetVehicleForm()
    }
  }

  const getRentalName = (rental) => {
    const fullName = rental.renter?.full_name?.trim()
    return fullName || [rental.renter?.first_name, rental.renter?.last_name].filter(Boolean).join(' ') || 'Unknown renter'
  }

  const renderHistoryContent = () => {
    if (isHistoryLoading) {
      return (
        <Stack spacing={1.25}>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} variant="rounded" height={62} />
          ))}
        </Stack>
      )
    }

    if (historyError) {
      return <Alert severity="error">{historyError}</Alert>
    }

    if (historyRentals.length === 0) {
      return (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 800 }}>No rental history yet</Typography>
          <Typography color="text.secondary">Rentals for this vehicle will appear here.</Typography>
        </Box>
      )
    }

    return (
      <Stack spacing={1.25}>
        {historyRentals.map((rental) => (
          <Box
            key={rental.id}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1.5,
              display: 'grid',
              gap: 0.5,
            }}
          >
            <Typography sx={{ fontWeight: 800 }}>{getRentalName(rental)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDateDisplay(rental.start_date)} - {formatDateDisplay(rental.end_date)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status: {rental.status} | Payment: {rental.payment_status}
            </Typography>
          </Box>
        ))}
      </Stack>
    )
  }

  const cars = vehicles.filter((vehicle) => vehicle.type === 'car')
  const vans = vehicles.filter((vehicle) => vehicle.type === 'van')

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          fullWidth
          sx={{ width: { xs: '100%', sm: 'auto' } }}
          onClick={openAddVehicle}
        >
          Add vehicle
        </Button>
      </Box>
      {vehiclesError && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchVehicles}>Retry</Button>} sx={{ mb: 2 }}>
          {vehiclesError}
        </Alert>
      )}

      <Box>
        {isLoadingVehicles ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} variant="rounded" height={180} />
            ))}
          </Box>
        ) : vehicles.length > 0 ? (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <VehicleSection
              title="Cars"
              vehicles={cars}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
              onEditVehicle={openEditVehicle}
              onShowHistory={openHistory}
            />
            <VehicleSection
              title="Vans"
              vehicles={vans}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
              onEditVehicle={openEditVehicle}
              onShowHistory={openHistory}
            />
          </Box>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 800 }}>No vehicles yet</Typography>
            <Typography color="text.secondary">Saved vehicles will appear here.</Typography>
          </Box>
        )}
      </Box>

      <Dialog
        open={isAddVehicleOpen}
        onClose={handleCloseVehicleModal}
        fullWidth
        maxWidth="sm"
        aria-label={editingVehicle ? 'Edit vehicle' : 'Add vehicle'}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          {editingVehicle ? 'Edit vehicle' : 'Add vehicle'}
          <IconButton onClick={handleCloseVehicleModal} size="small" aria-label="Close vehicle modal" disabled={isSaving}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}

          <Stack spacing={3} sx={{ py: 1 }}>
            <Stack spacing={2}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                Vehicle
              </Typography>
              <TextField
                label="Model"
                value={vehicleForm.model}
                onChange={(event) => updateField('model', event.target.value)}
                error={Boolean(fieldErrors.model)}
                helperText={fieldErrors.model}
                fullWidth
                required
                disabled={isSaving}
              />
              <TextField
                label="License plate"
                value={vehicleForm.licensePlate}
                onChange={(event) => updateField('licensePlate', event.target.value)}
                error={Boolean(fieldErrors.licensePlate)}
                helperText={fieldErrors.licensePlate}
                fullWidth
                required
                disabled={isSaving}
              />
              <FormControl fullWidth required error={Boolean(fieldErrors.type)} disabled={isSaving}>
                <InputLabel id="vehicle-type-label">Type</InputLabel>
                <Select
                  labelId="vehicle-type-label"
                  label="Type"
                  value={vehicleForm.type}
                  onChange={(event) => updateField('type', event.target.value)}
                >
                  <MenuItem value="car">Car</MenuItem>
                  <MenuItem value="van">Van</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack spacing={2}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800 }}>
                Registration
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    label="From"
                    type="text"
                    fullWidth
                    value={formatDateDisplay(vehicleForm.registrationStartDate)}
                    placeholder="From"
                    error={Boolean(fieldErrors.registrationStartDate)}
                    helperText={fieldErrors.registrationStartDate}
                    disabled={isSaving}
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
                    onClick={() => openDatePicker('registrationStartDate')}
                    disabled={isSaving}
                    sx={{
                      position: 'absolute',
                      right: 14,
                      top: fieldErrors.registrationStartDate ? '37%' : '50%',
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
                    label="To"
                    type="text"
                    fullWidth
                    value={formatDateDisplay(vehicleForm.registrationExpiryDate)}
                    placeholder="To"
                    error={Boolean(fieldErrors.registrationExpiryDate)}
                    helperText={fieldErrors.registrationExpiryDate}
                    disabled={isSaving}
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
                    onClick={() => openDatePicker('registrationExpiryDate')}
                    disabled={isSaving}
                    sx={{
                      position: 'absolute',
                      right: 14,
                      top: fieldErrors.registrationExpiryDate ? '37%' : '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                    }}
                    edge="end"
                  >
                    <CalendarTodayRoundedIcon />
                  </IconButton>
                </Box>
              </Box>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseVehicleModal} variant="outlined" disabled={isSaving} sx={{ flex: 1 }}>
            Cancel
          </Button>
          <Button onClick={handleSaveVehicle} variant="contained" disabled={isSaving || !canSaveVehicle} sx={{ flex: 1, color: 'common.white' }}>
            {isSaving ? 'Saving...' : editingVehicle ? 'Save changes' : 'Save vehicle'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(historyVehicle)} onClose={closeHistory} fullWidth maxWidth="sm" aria-label="Vehicle rental history">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Rental history</Typography>
            {historyVehicle && (
              <Typography variant="body2" color="text.secondary">
                {historyVehicle.license_plate} - {historyVehicle.model}
              </Typography>
            )}
          </Box>
          <IconButton onClick={closeHistory} size="small" aria-label="Close rental history">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>{renderHistoryContent()}</DialogContent>
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
    </Box>
  )
}
