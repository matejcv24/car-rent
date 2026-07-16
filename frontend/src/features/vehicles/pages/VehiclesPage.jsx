import AddRoundedIcon from '@mui/icons-material/AddRounded'
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
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
import { useCallback, useEffect, useState } from 'react'
import api, { getApiErrors, getApiMessage } from '../../../config/api.js'

const initialVehicleForm = {
  licensePlate: '',
  model: '',
  type: 'car',
  status: 'active',
  registrationStartDate: '',
  registrationExpiryDate: '',
}

const initialRentalForm = {
  vehicle: '',
  name: '',
  phone: '',
  email: '',
  startDate: '',
  endDate: '',
  paidStatus: '',
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

function VehicleSection({ title, icon, vehicles, selectedVehicleId, onSelectVehicle, onEditVehicle, onShowHistory }) {
  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 0.75 }}
      >
        {icon}
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
  const [selectedRental, setSelectedRental] = useState(null)
  const [rentalPendingDelete, setRentalPendingDelete] = useState(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [datePickerField, setDatePickerField] = useState('registrationStartDate')
  const [datePickerValue, setDatePickerValue] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRentalSaving, setIsRentalSaving] = useState(false)
  const [isRentalDeleting, setIsRentalDeleting] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [rentalSaveError, setRentalSaveError] = useState('')
  const [rentalDeleteError, setRentalDeleteError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [rentalFieldErrors, setRentalFieldErrors] = useState({})
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm)
  const [rentalForm, setRentalForm] = useState(initialRentalForm)
  const [vehicles, setVehicles] = useState([])
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true)
  const [vehiclesError, setVehiclesError] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('active')

  const fetchVehicles = useCallback(async () => {
    setVehiclesError('')
    setIsLoadingVehicles(true)

    try {
      const response = await api.get('/vehicles', { params: { limit: 100, status: vehicleStatusFilter } })
      setVehicles(response.data.data ?? [])
    } catch (error) {
      setVehiclesError(getApiMessage(error, 'Failed to load vehicles. Please try again.'))
    } finally {
      setIsLoadingVehicles(false)
    }
  }, [vehicleStatusFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVehicles()
  }, [fetchVehicles])

  const updateField = (field, value) => {
    setVehicleForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const updateRentalField = (field, value) => {
    setRentalForm((prev) => ({ ...prev, [field]: value }))
    setRentalFieldErrors((prev) => ({ ...prev, [field]: undefined }))
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
      status: vehicle.status ?? 'active',
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
    setSelectedRental(null)
    setRentalPendingDelete(null)
    setRentalForm(initialRentalForm)
    setRentalSaveError('')
    setRentalDeleteError('')
    setRentalFieldErrors({})
  }

  const openRentalDetails = (rental) => {
    blurActiveElement()
    setSelectedRental(rental)
    setRentalForm({
      vehicle: String(rental.vehicle.id),
      name: getRentalName(rental),
      phone: rental.renter?.phone ?? '',
      email: rental.renter?.email ?? '',
      startDate: rental.start_date ?? '',
      endDate: rental.end_date ?? '',
      paidStatus: rental.payment_status ?? '',
    })
    setRentalSaveError('')
    setRentalFieldErrors({})
  }

  const closeRentalDetails = () => {
    if (isRentalSaving || isRentalDeleting) return
    blurActiveElement()
    setSelectedRental(null)
    setRentalForm(initialRentalForm)
    setRentalSaveError('')
    setRentalFieldErrors({})
  }

  const openRentalDeleteDialog = () => {
    if (!selectedRental) return
    blurActiveElement()
    setRentalPendingDelete(selectedRental)
    setRentalDeleteError('')
  }

  const closeRentalDeleteDialog = () => {
    if (isRentalDeleting) return
    blurActiveElement()
    setRentalPendingDelete(null)
    setRentalDeleteError('')
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

  const canSaveRental = Boolean(
    rentalForm.vehicle &&
      rentalForm.name.trim() &&
      rentalForm.startDate &&
      rentalForm.endDate,
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
        await api.put(`/vehicles/${editingVehicle.id}`, {
          ...vehiclePayload,
          status: vehicleForm.status,
        })

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
        status: errors.status?.[0],
        registrationStartDate: errors['registration.start_date']?.[0] ?? errors.start_date?.[0],
        registrationExpiryDate: errors['registration.expiry_date']?.[0] ?? errors.expiry_date?.[0],
      })
      setSaveError(getApiMessage(error, 'Failed to save vehicle. Please try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRental = async () => {
    if (!selectedRental || !canSaveRental) {
      return
    }

    setRentalSaveError('')
    setRentalFieldErrors({})
    setIsRentalSaving(true)

    try {
      const payload = {
        vehicle_id: parseInt(rentalForm.vehicle),
        start_date: rentalForm.startDate,
        end_date: rentalForm.endDate,
        payment_status: rentalForm.paidStatus === 'paid' ? 'paid' : 'unpaid',
        renter: {
          first_name: rentalForm.name.trim(),
          last_name: '',
          phone: rentalForm.phone.trim(),
          email: rentalForm.email.trim(),
        },
      }

      const response = await api.put(`/rentals/${selectedRental.id}`, payload)
      const updatedRental = response.data.data

      setHistoryRentals((prev) => prev.map((rental) => (rental.id === updatedRental.id ? updatedRental : rental)))
      setSelectedRental(null)
      setRentalForm(initialRentalForm)
      fetchVehicles()
    } catch (error) {
      const errors = getApiErrors(error)

      setRentalFieldErrors({
        vehicle: errors.vehicle_id?.[0],
        name: errors['renter.first_name']?.[0],
        phone: errors['renter.phone']?.[0],
        email: errors['renter.email']?.[0],
        startDate: errors.start_date?.[0],
        endDate: errors.end_date?.[0],
        paidStatus: errors.payment_status?.[0],
      })
      setRentalSaveError(getApiMessage(error, 'Failed to save rental. Please try again.'))
    } finally {
      setIsRentalSaving(false)
    }
  }

  const handleDeleteRental = async () => {
    if (!rentalPendingDelete) {
      return
    }

    setRentalDeleteError('')
    setIsRentalDeleting(true)

    try {
      await api.delete(`/rentals/${rentalPendingDelete.id}`)
      setHistoryRentals((prev) => prev.filter((rental) => rental.id !== rentalPendingDelete.id))
      setRentalPendingDelete(null)
      setSelectedRental(null)
      setRentalForm(initialRentalForm)
      fetchVehicles()
    } catch (error) {
      setRentalDeleteError(getApiMessage(error, 'Failed to delete rental. Please try again.'))
    } finally {
      setIsRentalDeleting(false)
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
            role="button"
            tabIndex={0}
            onClick={() => openRentalDetails(rental)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openRentalDetails(rental)
              }
            }}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1.5,
              display: 'grid',
              gap: 0.5,
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
              '&:hover, &:focus-visible': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
                outline: 'none',
              },
            }}
          >
            <Typography sx={{ fontWeight: 800 }}>{getRentalName(rental)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDateDisplay(rental.start_date)} - {formatDateDisplay(rental.end_date)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Payment: {rental.payment_status}
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mb: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          fullWidth
          sx={{ width: { xs: '100%', sm: 'auto' } }}
          onClick={openAddVehicle}
        >
          Add vehicle
        </Button>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
          <InputLabel id="vehicle-status-filter-label">Status</InputLabel>
          <Select
            labelId="vehicle-status-filter-label"
            label="Status"
            value={vehicleStatusFilter}
            onChange={(event) => setVehicleStatusFilter(event.target.value)}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="retired">Inactive</MenuItem>
          </Select>
        </FormControl>
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
              icon={<DirectionsCarIcon fontSize="small" />}
              vehicles={cars}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
              onEditVehicle={openEditVehicle}
              onShowHistory={openHistory}
            />
            <VehicleSection
              title="Vans"
              icon={<AirportShuttleIcon fontSize="small" />}
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
              {editingVehicle && (
                <FormControl fullWidth required error={Boolean(fieldErrors.status)} disabled={isSaving}>
                  <InputLabel id="vehicle-status-label">Status</InputLabel>
                  <Select
                    labelId="vehicle-status-label"
                    label="Status"
                    value={vehicleForm.status}
                    onChange={(event) => updateField('status', event.target.value)}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="retired">Inactive</MenuItem>
                  </Select>
                </FormControl>
              )}
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
                {historyVehicle.model} - {historyVehicle.license_plate}
              </Typography>
            )}
          </Box>
          <IconButton onClick={closeHistory} size="small" aria-label="Close rental history">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>{renderHistoryContent()}</DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedRental)} onClose={closeRentalDetails} fullWidth maxWidth="sm" aria-label="Rental details">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Rental details</Typography>
            {selectedRental && (
              <Typography variant="body2" color="text.secondary">
                {selectedRental.vehicle.model} - {selectedRental.vehicle.license_plate}
              </Typography>
            )}
          </Box>
          <IconButton onClick={closeRentalDetails} size="small" aria-label="Close rental details" disabled={isRentalSaving}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {rentalSaveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {rentalSaveError}
            </Alert>
          )}

          <Stack spacing={2} sx={{ py: 1 }}>
            <FormControl fullWidth required disabled={isRentalSaving} error={Boolean(rentalFieldErrors.vehicle)}>
              <InputLabel id="history-rental-vehicle-label">Vehicle</InputLabel>
              <Select
                labelId="history-rental-vehicle-label"
                label="Vehicle"
                value={rentalForm.vehicle}
                onChange={(event) => updateRentalField('vehicle', event.target.value)}
              >
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={String(vehicle.id)}>
                    {vehicle.model} - {vehicle.license_plate}
                  </MenuItem>
                ))}
              </Select>
              {rentalFieldErrors.vehicle && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {rentalFieldErrors.vehicle}
                </Typography>
              )}
            </FormControl>

            <TextField
              label="Name and Surname"
              value={rentalForm.name}
              onChange={(event) => updateRentalField('name', event.target.value)}
              error={Boolean(rentalFieldErrors.name)}
              helperText={rentalFieldErrors.name}
              fullWidth
              required
              disabled={isRentalSaving}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Mobile phone"
                value={rentalForm.phone}
                onChange={(event) => updateRentalField('phone', event.target.value)}
                error={Boolean(rentalFieldErrors.phone)}
                helperText={rentalFieldErrors.phone}
                fullWidth
                disabled={isRentalSaving || isRentalDeleting}
              />
              <TextField
                label="Email address"
                value={rentalForm.email}
                onChange={(event) => updateRentalField('email', event.target.value)}
                error={Boolean(rentalFieldErrors.email)}
                helperText={rentalFieldErrors.email}
                fullWidth
                disabled={isRentalSaving || isRentalDeleting}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Start date"
                type="date"
                value={rentalForm.startDate}
                onChange={(event) => updateRentalField('startDate', event.target.value)}
                error={Boolean(rentalFieldErrors.startDate)}
                helperText={rentalFieldErrors.startDate}
                fullWidth
                required
                disabled={isRentalSaving}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="End date"
                type="date"
                value={rentalForm.endDate}
                onChange={(event) => updateRentalField('endDate', event.target.value)}
                error={Boolean(rentalFieldErrors.endDate)}
                helperText={rentalFieldErrors.endDate}
                fullWidth
                required
                disabled={isRentalSaving}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            <Box>
              <FormControl fullWidth error={Boolean(rentalFieldErrors.paidStatus)} disabled={isRentalSaving || isRentalDeleting}>
                <InputLabel>Payment status</InputLabel>
                <Select
                  value={rentalForm.paidStatus}
                  onChange={(event) => updateRentalField('paidStatus', event.target.value)}
                  label="Payment status"
                >
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                </Select>
                {rentalFieldErrors.paidStatus && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {rentalFieldErrors.paidStatus}
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, p: 2 }}>
          <Button onClick={closeRentalDetails} variant="outlined" disabled={isRentalSaving || isRentalDeleting} sx={{ minWidth: 0 }}>
            Cancel
          </Button>
          <Button onClick={openRentalDeleteDialog} variant="contained" color="error" disabled={isRentalSaving || isRentalDeleting} sx={{ minWidth: 0, color: 'common.white' }}>
            Delete
          </Button>
          <Button onClick={handleSaveRental} variant="contained" disabled={isRentalSaving || isRentalDeleting || !canSaveRental} sx={{ minWidth: 0, color: 'common.white' }}>
            {isRentalSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rentalPendingDelete)} onClose={closeRentalDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          Delete rental
          <IconButton onClick={closeRentalDeleteDialog} size="small" disabled={isRentalDeleting}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {rentalDeleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {rentalDeleteError}
            </Alert>
          )}
          <Typography sx={{ fontWeight: 700 }}>
            Are you sure that you want to delete this rental?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, p: 2 }}>
          <Button onClick={handleDeleteRental} variant="contained" color="error" disabled={isRentalDeleting} sx={{ color: 'common.white' }}>
            {isRentalDeleting ? 'Deleting...' : 'Yes'}
          </Button>
          <Button onClick={closeRentalDeleteDialog} variant="outlined" disabled={isRentalDeleting} sx={{ borderColor: '#0096FF', color: '#0096FF' }}>
            No
          </Button>
        </DialogActions>
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
