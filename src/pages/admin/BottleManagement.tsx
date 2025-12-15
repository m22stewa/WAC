import { useState, useRef, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { InputTextarea } from 'primereact/inputtextarea'
import { Toast } from 'primereact/toast'
import { Tag } from 'primereact/tag'
import { AppLayout } from '../../components/layout'
import { useEvents, useBottleSubmissions, useUsers, useCalendarDays } from '../../hooks'
import { BottleSubmission, BottleSubmissionForm, Profile } from '../../types'

const countryOptions = [
    { label: 'Scotland', value: 'Scotland' },
    { label: 'Ireland', value: 'Ireland' },
    { label: 'United States', value: 'United States' },
    { label: 'Japan', value: 'Japan' },
    { label: 'Canada', value: 'Canada' },
    { label: 'Taiwan', value: 'Taiwan' },
    { label: 'India', value: 'India' },
    { label: 'Other', value: 'Other' }
]

const styleOptions = [
    { label: 'Single Malt Scotch', value: 'Single Malt Scotch' },
    { label: 'Blended Scotch', value: 'Blended Scotch' },
    { label: 'Bourbon', value: 'Bourbon' },
    { label: 'Rye', value: 'Rye' },
    { label: 'Irish Whiskey', value: 'Irish Whiskey' },
    { label: 'Japanese Whisky', value: 'Japanese Whisky' },
    { label: 'Canadian Whisky', value: 'Canadian Whisky' },
    { label: 'Tennessee Whiskey', value: 'Tennessee Whiskey' },
    { label: 'Other', value: 'Other' }
]

const emptyForm: BottleSubmissionForm = {
    whiskey_name: '',
    distillery: '',
    country: '',
    style: '',
    abv: null,
    volume: '',
    price: null,
    purchase_url: '',
    notes: ''
}

export function BottleManagement() {
    const { events } = useEvents()
    const { users } = useUsers()
    const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined)
    const { submissions, loading, createSubmission, updateSubmission } = useBottleSubmissions(selectedEventId)
    const { days } = useCalendarDays(selectedEventId)
    const toast = useRef<Toast>(null)

    const [showDialog, setShowDialog] = useState(false)
    const [editingSubmission, setEditingSubmission] = useState<BottleSubmission | null>(null)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [formData, setFormData] = useState<BottleSubmissionForm>(emptyForm)
    const [saving, setSaving] = useState(false)

    const eventOptions = events.map(e => ({ label: `${e.name} (${e.year})`, value: e.id }))
    
    // All users are available for selection
    const userOptions = users.map(u => ({ 
        label: `${u.name || 'Unnamed'} (${u.email})`, 
        value: u.id 
    }))

    // Auto-select first event
    useEffect(() => {
        if (events.length > 0 && !selectedEventId) {
            setSelectedEventId(events[0].id)
        }
    }, [events, selectedEventId])

    const resetForm = () => {
        setFormData(emptyForm)
        setSelectedUserId(null)
        setEditingSubmission(null)
    }

    const openCreateDialog = () => {
        resetForm()
        setShowDialog(true)
    }

    const openEditDialog = (submission: BottleSubmission) => {
        setEditingSubmission(submission)
        setSelectedUserId(submission.user_id)
        setFormData({
            whiskey_name: submission.whiskey_name,
            distillery: submission.distillery || '',
            country: submission.country || '',
            style: submission.style || '',
            abv: submission.abv,
            volume: submission.volume || '',
            price: submission.price,
            purchase_url: submission.purchase_url || '',
            notes: submission.notes || ''
        })
        setShowDialog(true)
    }

    const handleSave = async () => {
        if (!formData.whiskey_name.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Whiskey name is required' })
            return
        }

        setSaving(true)
        try {
            if (editingSubmission) {
                await updateSubmission(editingSubmission.id, {
                    ...formData,
                    user_id: selectedUserId || null
                })
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Bottle updated' })
            } else {
                if (!selectedEventId) {
                    toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Event is required' })
                    setSaving(false)
                    return
                }
                await createSubmission({
                    event_id: selectedEventId,
                    user_id: selectedUserId || null,
                    ...formData
                })
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Bottle created' })
            }
            setShowDialog(false)
            resetForm()
        } catch (error) {
            console.error('Error saving bottle:', error)
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save bottle' })
        } finally {
            setSaving(false)
        }
    }

    const userTemplate = (row: BottleSubmission) => {
        const profile = (row as any).profile as Profile | undefined
        return (
            <div>
                <div className="font-bold">{profile?.name || 'Unknown'}</div>
                <div className="text-color-secondary text-sm">{profile?.email || ''}</div>
            </div>
        )
    }

    const bottleTemplate = (row: BottleSubmission) => (
        <div>
            <div className="font-bold">{row.whiskey_name}</div>
            {row.distillery && <div className="text-color-secondary text-sm">{row.distillery}</div>}
        </div>
    )

    const placementTemplate = (row: BottleSubmission) => {
        const assignedDay = days.find(d => d.bottle_submission_id === row.id)
        const selectedEvent = events.find(e => e.id === selectedEventId)
        
        if (assignedDay && selectedEvent) {
            return <div className="font-medium">{selectedEvent.year} - Day {assignedDay.day_number}</div>
        }
        return <div className="text-color-secondary text-sm">Not assigned</div>
    }

    const detailsTemplate = (row: BottleSubmission) => (
        <div className="flex flex-wrap gap-2">
            {row.country && <Tag value={row.country} severity="info" />}
            {row.style && <Tag value={row.style} />}
            {row.abv && <Tag value={`${row.abv}%`} severity="warning" />}
        </div>
    )

    const priceTemplate = (row: BottleSubmission) => (
        row.price ? `$${row.price}` : '-'
    )

    const actionsTemplate = (row: BottleSubmission) => (
        <Button
            icon="pi pi-pencil"
            className="p-button-text p-button-sm"
            onClick={() => openEditDialog(row)}
            tooltip="Edit Bottle"
        />
    )

    return (
        <AppLayout>
            <Toast ref={toast} />

            <div className="max-w-6xl mx-auto">
                <div className="flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                    <div>
                        <h1 className="m-0 mb-1">Bottle Management</h1>
                        <p className="text-color-secondary m-0">View and manage all bottle submissions</p>
                    </div>
                    <Button 
                        label="Add Bottle for User" 
                        icon="pi pi-plus" 
                        onClick={openCreateDialog} 
                        disabled={!selectedEventId}
                    />
                </div>

                <Card className="mb-4">
                    <div className="field">
                        <label htmlFor="eventFilter" className="block mb-2 font-medium">Select Event</label>
                        <Dropdown
                            id="eventFilter"
                            value={selectedEventId}
                            options={eventOptions}
                            onChange={(e) => setSelectedEventId(e.value)}
                            placeholder="Select an event"
                            className="w-full md:w-20rem"
                        />
                    </div>
                </Card>

                <Card>
                    <DataTable
                        value={submissions}
                        loading={loading}
                        stripedRows
                        responsiveLayout="scroll"
                        emptyMessage={selectedEventId ? "No bottles submitted yet." : "Select an event to view submissions."}
                    >
                        <Column header="Member" body={userTemplate} sortable style={{ width: '200px' }} />
                        <Column header="Whiskey" body={bottleTemplate} sortable />
                        <Column header="Placement" body={placementTemplate} sortable style={{ width: '150px' }} />
                        <Column header="Details" body={detailsTemplate} />
                        <Column header="Price" body={priceTemplate} style={{ width: '100px' }} />
                        <Column header="Actions" body={actionsTemplate} style={{ width: '80px' }} />
                    </DataTable>
                </Card>

                <Dialog
                    header={editingSubmission ? 'Edit Bottle' : 'Add Bottle for User'}
                    visible={showDialog}
                    onHide={() => setShowDialog(false)}
                    style={{ width: '600px' }}
                    className="p-fluid"
                >
                    <div className="flex flex-column gap-3 pt-3">
                        <div className="field">
                            <label htmlFor="userSelect" className="block mb-2 font-medium">Select User (Optional)</label>
                            <Dropdown
                                id="userSelect"
                                value={selectedUserId}
                                options={userOptions}
                                onChange={(e) => setSelectedUserId(e.value)}
                                placeholder="Select a user (or leave empty)"
                                className="w-full"
                                filter
                                showClear
                                emptyMessage="No users available"
                            />
                            {editingSubmission && (
                                <small className="text-color-secondary">Change the user assigned to this bottle</small>
                            )}
                        </div>

                        <div className="field">
                            <label htmlFor="whiskey_name" className="block mb-2 font-medium">Whiskey Name *</label>
                            <InputText
                                id="whiskey_name"
                                value={formData.whiskey_name}
                                onChange={(e) => setFormData({ ...formData, whiskey_name: e.target.value })}
                                placeholder="e.g., Lagavulin 16 Year"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="distillery" className="block mb-2 font-medium">Distillery</label>
                            <InputText
                                id="distillery"
                                value={formData.distillery}
                                onChange={(e) => setFormData({ ...formData, distillery: e.target.value })}
                                placeholder="e.g., Lagavulin"
                            />
                        </div>

                        <div className="grid">
                            <div className="col-6">
                                <div className="field">
                                    <label htmlFor="country" className="block mb-2 font-medium">Country</label>
                                    <Dropdown
                                        id="country"
                                        value={formData.country}
                                        options={countryOptions}
                                        onChange={(e) => setFormData({ ...formData, country: e.value })}
                                        placeholder="Select country"
                                    />
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="field">
                                    <label htmlFor="style" className="block mb-2 font-medium">Style</label>
                                    <Dropdown
                                        id="style"
                                        value={formData.style}
                                        options={styleOptions}
                                        onChange={(e) => setFormData({ ...formData, style: e.value })}
                                        placeholder="Select style"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid">
                            <div className="col-4">
                                <div className="field">
                                    <label htmlFor="abv" className="block mb-2 font-medium">ABV %</label>
                                    <InputNumber
                                        id="abv"
                                        value={formData.abv}
                                        onValueChange={(e) => setFormData({ ...formData, abv: e.value ?? null })}
                                        mode="decimal"
                                        minFractionDigits={0}
                                        maxFractionDigits={1}
                                        min={0}
                                        max={100}
                                    />
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="field">
                                    <label htmlFor="volume" className="block mb-2 font-medium">Volume</label>
                                    <InputText
                                        id="volume"
                                        value={formData.volume}
                                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                                        placeholder="e.g., 750ml"
                                    />
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="field">
                                    <label htmlFor="price" className="block mb-2 font-medium">Price ($)</label>
                                    <InputNumber
                                        id="price"
                                        value={formData.price}
                                        onValueChange={(e) => setFormData({ ...formData, price: e.value ?? null })}
                                        mode="currency"
                                        currency="USD"
                                        locale="en-US"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="purchase_url" className="block mb-2 font-medium">Purchase URL</label>
                            <InputText
                                id="purchase_url"
                                value={formData.purchase_url}
                                onChange={(e) => setFormData({ ...formData, purchase_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="notes" className="block mb-2 font-medium">Notes / Description</label>
                            <InputTextarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                placeholder="Tasting notes, description, etc."
                            />
                        </div>

                        <div className="flex justify-content-end gap-2 mt-3">
                            <Button label="Cancel" className="p-button-text" onClick={() => setShowDialog(false)} />
                            <Button
                                label={saving ? 'Saving...' : 'Save Bottle'}
                                icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                                onClick={handleSave}
                                disabled={saving}
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        </AppLayout>
    )
}
