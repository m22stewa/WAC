import { useState, useRef, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { Toast } from 'primereact/toast'
import { AppLayout } from '../../components/layout'
import { useEvents, useBottleSubmissions, useCalendarDays } from '../../hooks'

export function DayAssignment() {
    const { events } = useEvents()
    const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined)
    const { submissions } = useBottleSubmissions(selectedEventId)
    const { days, updateDay } = useCalendarDays(selectedEventId)
    const toast = useRef<Toast>(null)
    const [saving, setSaving] = useState(false)

    const eventOptions = events.map(e => ({ label: `${e.name} (${e.year})`, value: e.id }))
    const dayOptions = Array.from({ length: 24 }, (_, i) => ({ label: `Day ${i + 1}`, value: i + 1 }))

    // Auto-select first event
    useEffect(() => {
        if (events.length > 0 && !selectedEventId) {
            setSelectedEventId(events[0].id)
        }
    }, [events])

    const handleAssign = async (dayId: string, bottleSubmissionId: string | null) => {
        try {
            await updateDay(dayId, { bottle_submission_id: bottleSubmissionId })
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Day assignment updated' })
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to update assignment' })
        }
    }

    const handleRevealToggle = async (dayId: string, isRevealed: boolean) => {
        try {
            await updateDay(dayId, { is_revealed: !isRevealed })
            toast.current?.show({ severity: 'success', summary: 'Success', detail: `Day ${isRevealed ? 'hidden' : 'revealed'}` })
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to toggle reveal' })
        }
    }

    const submissionOptions = [
        { label: '-- Unassigned --', value: null },
        ...submissions.map(s => ({
            label: `${s.whiskey_name} (${(s as any).profile?.name || 'Unknown'})`,
            value: s.id
        }))
    ]

    return (
        <AppLayout>
            <Toast ref={toast} />

            <div className="max-w-5xl mx-auto">
                <h1 className="mb-1">📆 Day Assignment</h1>
                <p className="text-color-secondary mb-4">Assign bottles to calendar days and control reveals</p>

                <Card className="mb-4">
                    <div className="field">
                        <label htmlFor="eventSelect" className="block mb-2 font-medium">Select Event</label>
                        <Dropdown
                            id="eventSelect"
                            value={selectedEventId}
                            options={eventOptions}
                            onChange={(e) => setSelectedEventId(e.value)}
                            placeholder="Select an event"
                            className="w-full md:w-20rem"
                        />
                    </div>
                </Card>

                {selectedEventId && days.length === 0 && (
                    <Card className="text-center p-4">
                        <i className="pi pi-calendar text-4xl text-color-secondary mb-3" />
                        <h3>No Calendar Days</h3>
                        <p className="text-color-secondary">Calendar days haven't been created for this event yet.</p>
                    </Card>
                )}

                {days.length > 0 && (
                    <div className="grid">
                        {days.map((day) => (
                            <div key={day.id} className="col-12 md:col-6 lg:col-4">
                                <Card className={day.is_revealed ? 'border-green-500 border-2' : ''}>
                                    <div className="flex justify-content-between align-items-center mb-3">
                                        <span className="text-xl font-bold">Day {day.day_number}</span>
                                        <Button
                                            icon={day.is_revealed ? 'pi pi-eye' : 'pi pi-eye-slash'}
                                            className={`p-button-rounded p-button-sm ${day.is_revealed ? 'p-button-success' : 'p-button-secondary'}`}
                                            onClick={() => handleRevealToggle(day.id, day.is_revealed)}
                                            tooltip={day.is_revealed ? 'Click to hide' : 'Click to reveal'}
                                        />
                                    </div>

                                    <Dropdown
                                        value={day.bottle_submission_id}
                                        options={submissionOptions}
                                        onChange={(e) => handleAssign(day.id, e.value)}
                                        placeholder="Assign a bottle"
                                        className="w-full"
                                    />

                                    {day.bottle_submission && (
                                        <div className="mt-2 p-2 surface-100 border-round text-sm">
                                            <div className="font-bold">{(day.bottle_submission as any).whiskey_name}</div>
                                            <div className="text-color-secondary">
                                                by {(day.bottle_submission as any).profile?.name || 'Unknown'}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
