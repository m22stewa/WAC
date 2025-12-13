import { useState, useRef } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { InputNumber } from 'primereact/inputnumber'
import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { Tag } from 'primereact/tag'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { AppLayout } from '../../components/layout'
import { useEvents, useCalendarDays } from '../../hooks'
import { useAuth } from '../../context'
import { Event, EventStatus } from '../../types'

const CURRENT_YEAR = new Date().getFullYear()

const statusOptions = [
    { label: 'Planned', value: 'planned' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' }
]

export function EventManagement() {
    const { user } = useAuth()
    const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents()
    const { createDaysForEvent } = useCalendarDays()
    const toast = useRef<Toast>(null)

    const [showDialog, setShowDialog] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        year: CURRENT_YEAR,
        start_date: new Date(CURRENT_YEAR, 11, 1), // December 1st
        end_date: new Date(CURRENT_YEAR, 11, 24),   // December 24th
        description: '',
        status: 'planned' as EventStatus
    })

    const resetForm = () => {
        setFormData({
            name: `Whiskey Advent ${CURRENT_YEAR}`,
            year: CURRENT_YEAR,
            start_date: new Date(CURRENT_YEAR, 11, 1),
            end_date: new Date(CURRENT_YEAR, 11, 24),
            description: '',
            status: 'planned'
        })
        setEditingEvent(null)
    }

    const openCreateDialog = () => {
        resetForm()
        setShowDialog(true)
    }

    const openEditDialog = (event: Event) => {
        setEditingEvent(event)
        setFormData({
            name: event.name,
            year: event.year,
            start_date: new Date(event.start_date),
            end_date: new Date(event.end_date),
            description: event.description || '',
            status: event.status
        })
        setShowDialog(true)
    }

    const handleSave = async () => {
        try {
            if (editingEvent) {
                await updateEvent(editingEvent.id, {
                    ...formData,
                    start_date: formData.start_date.toISOString().split('T')[0],
                    end_date: formData.end_date.toISOString().split('T')[0]
                })
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Event updated' })
            } else {
                const newEvent = await createEvent({
                    ...formData,
                    start_date: formData.start_date.toISOString().split('T')[0],
                    end_date: formData.end_date.toISOString().split('T')[0],
                    created_by: user?.id
                })
                // Create 24 calendar days for the new event
                await createDaysForEvent(newEvent.id, formData.start_date)
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Event created with 24 calendar days' })
            }
            setShowDialog(false)
            resetForm()
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save event' })
        }
    }

    const handleDelete = (event: Event) => {
        confirmDialog({
            message: `Are you sure you want to delete "${event.name}"? This will also delete all associated data.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await deleteEvent(event.id)
                    toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Event deleted' })
                } catch (error) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete event' })
                }
            }
        })
    }

    const statusTemplate = (row: Event) => {
        const severity = row.status === 'active' ? 'success' : row.status === 'completed' ? 'info' : 'warning'
        return <Tag value={row.status} severity={severity} />
    }

    const actionsTemplate = (row: Event) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEditDialog(row)} tooltip="Edit" />
            <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => handleDelete(row)} tooltip="Delete" />
        </div>
    )

    return (
        <AppLayout>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="max-w-5xl mx-auto">
                <div className="flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                    <div>
                        <h1 className="m-0 mb-1">📅 Event Management</h1>
                        <p className="text-color-secondary m-0">Create and manage Advent calendar events</p>
                    </div>
                    <Button label="New Event" icon="pi pi-plus" onClick={openCreateDialog} />
                </div>

                <Card>
                    <DataTable value={events} loading={loading} stripedRows responsiveLayout="scroll" emptyMessage="No events yet. Create your first event!">
                        <Column field="name" header="Event Name" sortable />
                        <Column field="year" header="Year" sortable style={{ width: '100px' }} />
                        <Column field="status" header="Status" body={statusTemplate} sortable />
                        <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
                    </DataTable>
                </Card>

                <Dialog
                    header={editingEvent ? 'Edit Event' : 'Create New Event'}
                    visible={showDialog}
                    onHide={() => setShowDialog(false)}
                    style={{ width: '500px' }}
                >
                    <div className="flex flex-column gap-3 pt-3">
                        <div className="field">
                            <label htmlFor="eventName" className="block mb-2 font-medium">Event Name *</label>
                            <InputText
                                id="eventName"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Whiskey Advent 2025"
                                className="w-full"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="year" className="block mb-2 font-medium">Year *</label>
                            <InputNumber
                                id="year"
                                value={formData.year}
                                onValueChange={(e) => setFormData({ ...formData, year: e.value || CURRENT_YEAR })}
                                useGrouping={false}
                                className="w-full"
                            />
                        </div>

                        <div className="grid">
                            <div className="col-6">
                                <div className="field">
                                    <label htmlFor="startDate" className="block mb-2 font-medium">Start Date</label>
                                    <Calendar
                                        id="startDate"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.value as Date })}
                                        showIcon
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="field">
                                    <label htmlFor="endDate" className="block mb-2 font-medium">End Date</label>
                                    <Calendar
                                        id="endDate"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.value as Date })}
                                        showIcon
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="status" className="block mb-2 font-medium">Status</label>
                            <Dropdown
                                id="status"
                                value={formData.status}
                                options={statusOptions}
                                onChange={(e) => setFormData({ ...formData, status: e.value })}
                                className="w-full"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="description" className="block mb-2 font-medium">Description</label>
                            <InputTextarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full"
                            />
                        </div>

                        <div className="flex justify-content-end gap-2 mt-3">
                            <Button label="Cancel" className="p-button-text" onClick={() => setShowDialog(false)} />
                            <Button label={editingEvent ? 'Save Changes' : 'Create Event'} icon="pi pi-check" onClick={handleSave} disabled={!formData.name} />
                        </div>
                    </div>
                </Dialog>
            </div>
        </AppLayout>
    )
}
