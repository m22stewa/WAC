import { useState, useRef } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { AppLayout } from '../../components/layout'
import { useAnnouncements, useEvents } from '../../hooks'
import { useAuth } from '../../context'
import { Announcement } from '../../types'

export function AnnouncementEditor() {
    const { user } = useAuth()
    const { events } = useEvents()
    const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined)
    const { announcements, loading, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements(selectedEventId)
    const toast = useRef<Toast>(null)

    const [showDialog, setShowDialog] = useState(false)
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        event_id: ''
    })

    const eventOptions = events.map(e => ({ label: `${e.name} (${e.year})`, value: e.id }))

    const resetForm = () => {
        setFormData({
            title: '',
            body: '',
            event_id: selectedEventId || ''
        })
        setEditingAnnouncement(null)
    }

    const openCreateDialog = () => {
        resetForm()
        setShowDialog(true)
    }

    const openEditDialog = (announcement: Announcement) => {
        setEditingAnnouncement(announcement)
        setFormData({
            title: announcement.title,
            body: announcement.body || '',
            event_id: announcement.event_id
        })
        setShowDialog(true)
    }

    const handleSave = async () => {
        try {
            if (editingAnnouncement) {
                await updateAnnouncement(editingAnnouncement.id, {
                    title: formData.title,
                    body: formData.body
                })
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Announcement updated' })
            } else {
                await createAnnouncement({
                    ...formData,
                    created_by: user?.id
                })
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Announcement posted' })
            }
            setShowDialog(false)
            resetForm()
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save announcement' })
        }
    }

    const handleDelete = (announcement: Announcement) => {
        confirmDialog({
            message: `Are you sure you want to delete "${announcement.title}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await deleteAnnouncement(announcement.id)
                    toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Announcement deleted' })
                } catch (error) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete announcement' })
                }
            }
        })
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const actionsTemplate = (row: Announcement) => (
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
                        <h1 className="m-0 mb-1">Announcement Management</h1>
                        <p className="text-color-secondary m-0">Create and manage announcements for events</p>
                    </div>
                    <Button label="New Announcement" icon="pi pi-plus" onClick={openCreateDialog} disabled={!selectedEventId} />
                </div>

                <Card className="mb-4">
                    <div className="field">
                        <label htmlFor="eventFilter" className="block mb-2 font-medium">Filter by Event</label>
                        <Dropdown
                            id="eventFilter"
                            value={selectedEventId}
                            options={eventOptions}
                            onChange={(e) => setSelectedEventId(e.value)}
                            placeholder="Select an event to view announcements"
                            className="w-full md:w-20rem"
                            showClear
                        />
                    </div>
                </Card>

                <Card>
                    <DataTable
                        value={announcements}
                        loading={loading}
                        stripedRows
                        responsiveLayout="scroll"
                        emptyMessage={selectedEventId ? "No announcements yet." : "Select an event to view announcements."}
                    >
                        <Column field="title" header="Title" sortable />
                        <Column field="created_at" header="Posted" body={(row) => formatDate(row.created_at)} sortable style={{ width: '150px' }} />
                        <Column header="Actions" body={actionsTemplate} style={{ width: '100px' }} />
                    </DataTable>
                </Card>

                <Dialog
                    header={editingAnnouncement ? 'Edit Announcement' : 'Post Announcement'}
                    visible={showDialog}
                    onHide={() => setShowDialog(false)}
                    style={{ width: '600px' }}
                >
                    <div className="flex flex-column gap-3 pt-3">
                        {!editingAnnouncement && (
                            <div className="field">
                                <label htmlFor="eventSelect" className="block mb-2 font-medium">Event *</label>
                                <Dropdown
                                    id="eventSelect"
                                    value={formData.event_id}
                                    options={eventOptions}
                                    onChange={(e) => setFormData({ ...formData, event_id: e.value })}
                                    placeholder="Select event"
                                    className="w-full"
                                />
                            </div>
                        )}

                        <div className="field">
                            <label htmlFor="title" className="block mb-2 font-medium">Title *</label>
                            <InputText
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Announcement title"
                                className="w-full"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="body" className="block mb-2 font-medium">Message *</label>
                            <InputTextarea
                                id="body"
                                value={formData.body}
                                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                placeholder="Write your announcement..."
                                rows={8}
                                className="w-full"
                            />
                        </div>

                        <div className="flex justify-content-end gap-2 mt-3">
                            <Button label="Cancel" className="p-button-text" onClick={() => setShowDialog(false)} />
                            <Button
                                label={editingAnnouncement ? 'Save Changes' : 'Post Announcement'}
                                icon="pi pi-send"
                                onClick={handleSave}
                                disabled={!formData.title || !formData.body || (!editingAnnouncement && !formData.event_id)}
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        </AppLayout>
    )
}
