import { useState, useRef } from 'react'
import { Card } from 'primereact/card'
import { Accordion, AccordionTab } from 'primereact/accordion'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { InputTextarea } from 'primereact/inputtextarea'
import { Toast } from 'primereact/toast'
import { AppLayout } from '../components/layout'
import { useAuth } from '../context'
import { useEvents, useBottleSubmissions } from '../hooks'
import { Event, BottleSubmission } from '../types'

const CURRENT_YEAR = new Date().getFullYear()

export function History() {
    const { isAdmin } = useAuth()
    const { events, updateEvent } = useEvents()
    const toast = useRef<Toast>(null)

    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [showEventDialog, setShowEventDialog] = useState(false)

    const [eventForm, setEventForm] = useState({ name: '', description: '' })

    // Filter to show only completed/past events
    const pastEvents = events.filter(e => e.year < CURRENT_YEAR || e.status === 'completed')

    const openEditEvent = (event: Event) => {
        setEditingEvent(event)
        setEventForm({ name: event.name, description: event.description || '' })
        setShowEventDialog(true)
    }

    const handleSaveEvent = async () => {
        if (!editingEvent) return
        try {
            await updateEvent(editingEvent.id, eventForm)
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Event updated' })
            setShowEventDialog(false)
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to update event' })
        }
    }

    return (
        <AppLayout>
            <Toast ref={toast} />

            <div className="max-w-4xl mx-auto">
                <h1 className="mb-2">📚 History</h1>
                <p className="text-color-secondary mb-4">Look back at past Advent calendars</p>

                {pastEvents.length === 0 ? (
                    <Card className="text-center p-5">
                        <div className="text-4xl mb-3">📦</div>
                        <h3>No History Yet</h3>
                        <p className="text-color-secondary">Past events will appear here once completed.</p>
                    </Card>
                ) : (
                    <Accordion multiple>
                        {pastEvents.map((event) => (
                            <AccordionTab
                                key={event.id}
                                header={
                                    <div className="flex align-items-center gap-3 w-full">
                                        <span className="bg-primary text-white px-2 py-1 border-round text-sm font-bold">{event.year}</span>
                                        <span className="font-bold flex-1">{event.name}</span>
                                        {isAdmin && (
                                            <Button
                                                icon="pi pi-pencil"
                                                className="p-button-text p-button-sm p-button-rounded"
                                                onClick={(e) => { e.stopPropagation(); openEditEvent(event); }}
                                                tooltip="Edit Event"
                                            />
                                        )}
                                    </div>
                                }
                            >
                                {event.description && (
                                    <p className="text-color-secondary mb-3">{event.description}</p>
                                )}

                                <HistoryEventBottles eventId={event.id} isAdmin={isAdmin} />
                            </AccordionTab>
                        ))}
                    </Accordion>
                )}

                {/* Edit Event Dialog */}
                <Dialog
                    header="Edit Event"
                    visible={showEventDialog}
                    onHide={() => setShowEventDialog(false)}
                    style={{ width: '450px' }}
                >
                    <div className="flex flex-column gap-3 pt-3">
                        <div className="field">
                            <label className="block mb-2 font-medium">Event Name</label>
                            <InputText
                                value={eventForm.name}
                                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                                className="w-full"
                            />
                        </div>
                        <div className="field">
                            <label className="block mb-2 font-medium">Description</label>
                            <InputTextarea
                                value={eventForm.description}
                                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                rows={3}
                                className="w-full"
                            />
                        </div>
                        <div className="flex justify-content-end gap-2">
                            <Button label="Cancel" className="p-button-text" onClick={() => setShowEventDialog(false)} />
                            <Button label="Save" icon="pi pi-check" onClick={handleSaveEvent} />
                        </div>
                    </div>
                </Dialog>
            </div>
        </AppLayout>
    )
}

// Sub-component for loading bottles per event
function HistoryEventBottles({ eventId, isAdmin }: { eventId: string; isAdmin: boolean }) {
    const { submissions, updateSubmission } = useBottleSubmissions(eventId)
    const [editingBottle, setEditingBottle] = useState<BottleSubmission | null>(null)
    const [showDialog, setShowDialog] = useState(false)
    const [form, setForm] = useState({
        whiskey_name: '',
        distillery: '',
        country: '',
        abv: null as number | null,
        price: null as number | null
    })
    const toast = useRef<Toast>(null)

    const openEdit = (bottle: BottleSubmission) => {
        setEditingBottle(bottle)
        setForm({
            whiskey_name: bottle.whiskey_name,
            distillery: bottle.distillery || '',
            country: bottle.country || '',
            abv: bottle.abv,
            price: bottle.price
        })
        setShowDialog(true)
    }

    const handleSave = async () => {
        if (!editingBottle) return
        try {
            await updateSubmission(editingBottle.id, form)
            setShowDialog(false)
        } catch (error) {
            console.error('Failed to update bottle')
        }
    }

    const actionsTemplate = (row: BottleSubmission) => isAdmin ? (
        <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} />
    ) : null

    return (
        <>
            <Toast ref={toast} />
            <DataTable value={submissions} stripedRows responsiveLayout="scroll" emptyMessage="No bottles recorded.">
                <Column field="whiskey_name" header="Whiskey" sortable />
                <Column field="distillery" header="Distillery" />
                <Column field="country" header="Country" />
                <Column field="price" header="Price" body={(row) => row.price ? `$${row.price}` : '-'} />
                {isAdmin && <Column header="" body={actionsTemplate} style={{ width: '60px' }} />}
            </DataTable>

            <Dialog header="Edit Bottle" visible={showDialog} onHide={() => setShowDialog(false)} style={{ width: '450px' }}>
                <div className="flex flex-column gap-3 pt-3">
                    <div className="field">
                        <label className="block mb-2 font-medium">Whiskey Name</label>
                        <InputText value={form.whiskey_name} onChange={(e) => setForm({ ...form, whiskey_name: e.target.value })} className="w-full" />
                    </div>
                    <div className="field">
                        <label className="block mb-2 font-medium">Distillery</label>
                        <InputText value={form.distillery} onChange={(e) => setForm({ ...form, distillery: e.target.value })} className="w-full" />
                    </div>
                    <div className="grid">
                        <div className="col-6">
                            <label className="block mb-2 font-medium">ABV (%)</label>
                            <InputNumber value={form.abv} onValueChange={(e) => setForm({ ...form, abv: e.value ?? null })} suffix="%" className="w-full" />
                        </div>
                        <div className="col-6">
                            <label className="block mb-2 font-medium">Price</label>
                            <InputNumber value={form.price} onValueChange={(e) => setForm({ ...form, price: e.value ?? null })} mode="currency" currency="USD" className="w-full" />
                        </div>
                    </div>
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancel" className="p-button-text" onClick={() => setShowDialog(false)} />
                        <Button label="Save" icon="pi pi-check" onClick={handleSave} />
                    </div>
                </div>
            </Dialog>
        </>
    )
}
