import { useState, useEffect, useRef } from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { Divider } from 'primereact/divider'
import { Message } from 'primereact/message'
import { Toast } from 'primereact/toast'
import { ProgressSpinner } from 'primereact/progressspinner'
import { AppLayout } from '../components/layout'
import { useAuth } from '../context'
import { useCurrentEvent, useBottleSubmissions } from '../hooks'
import { BottleSubmissionForm } from '../types'

const CURRENT_YEAR = new Date().getFullYear()

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

export function MyBottle() {
    const { user } = useAuth()
    const { event, loading: eventLoading } = useCurrentEvent()
    const { submissions, createSubmission, updateSubmission, loading: submissionsLoading } = useBottleSubmissions(event?.id)
    const toast = useRef<Toast>(null)

    const [bottle, setBottle] = useState<BottleSubmissionForm>({
        whiskey_name: '',
        distillery: '',
        country: '',
        style: '',
        abv: null,
        volume: '',
        price: null,
        purchase_url: '',
        notes: ''
    })
    const [isEditing, setIsEditing] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Find if user already has a submission for this event
    const existingSubmission = submissions.find(s => s.user_id === user?.id)

    // Load existing submission into form
    useEffect(() => {
        if (existingSubmission) {
            setBottle({
                whiskey_name: existingSubmission.whiskey_name,
                distillery: existingSubmission.distillery || '',
                country: existingSubmission.country || '',
                style: existingSubmission.style || '',
                abv: existingSubmission.abv,
                volume: existingSubmission.volume || '',
                price: existingSubmission.price,
                purchase_url: existingSubmission.purchase_url || '',
                notes: existingSubmission.notes || ''
            })
            setIsEditing(false)
        }
    }, [existingSubmission])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!event || !user) return

        setSaving(true)
        setError(null)

        try {
            if (existingSubmission) {
                // Update existing
                await updateSubmission(existingSubmission.id, {
                    ...bottle,
                    abv: bottle.abv,
                    price: bottle.price
                })
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Bottle updated!' })
            } else {
                // Create new
                await createSubmission({
                    event_id: event.id,
                    user_id: user.id,
                    ...bottle
                })
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Bottle submitted!' })
            }
            setIsEditing(false)
        } catch (err) {
            console.error('Error saving bottle:', err)
            setError(err instanceof Error ? err.message : 'Failed to save bottle')
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save bottle' })
        } finally {
            setSaving(false)
        }
    }

    if (eventLoading || submissionsLoading) {
        return (
            <AppLayout>
                <div className="flex align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
                    <ProgressSpinner />
                </div>
            </AppLayout>
        )
    }

    if (!event) {
        return (
            <AppLayout>
                <div className="max-w-3xl mx-auto">
                    <h1 className="mb-2">My Bottle Submission</h1>
                    <Message
                        severity="warn"
                        text={`No calendar event found for ${CURRENT_YEAR}. An admin needs to create one first.`}
                        className="w-full"
                    />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <Toast ref={toast} />
            <div className="max-w-3xl mx-auto">
                <h1 className="mb-2">My Bottle Submission</h1>
                <p className="text-color-secondary mb-4">Submit your whiskey for the {CURRENT_YEAR} Advent Calendar</p>

                {error && (
                    <Message severity="error" text={error} className="w-full mb-3" />
                )}

                <Card>
                    <form onSubmit={handleSubmit}>
                        <div className="grid">
                            <div className="col-12">
                                <div className="field">
                                    <label htmlFor="whiskey_name" className="block mb-2 font-medium">Whiskey Name *</label>
                                    <InputText
                                        id="whiskey_name"
                                        value={bottle.whiskey_name}
                                        onChange={(e) => setBottle({ ...bottle, whiskey_name: e.target.value })}
                                        placeholder="e.g., Lagavulin 16 Year"
                                        className="w-full"
                                        disabled={!isEditing}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="col-12 md:col-6">
                                <div className="field">
                                    <label htmlFor="distillery" className="block mb-2 font-medium">Distillery</label>
                                    <InputText
                                        id="distillery"
                                        value={bottle.distillery}
                                        onChange={(e) => setBottle({ ...bottle, distillery: e.target.value })}
                                        placeholder="e.g., Lagavulin"
                                        className="w-full"
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="col-12 md:col-6">
                                <div className="field">
                                    <label htmlFor="country" className="block mb-2 font-medium">Country</label>
                                    <Dropdown
                                        id="country"
                                        value={bottle.country}
                                        onChange={(e) => setBottle({ ...bottle, country: e.value })}
                                        options={countryOptions}
                                        placeholder="Select country"
                                        className="w-full"
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="col-12 md:col-6">
                                <div className="field">
                                    <label htmlFor="style" className="block mb-2 font-medium">Style / Type</label>
                                    <Dropdown
                                        id="style"
                                        value={bottle.style}
                                        onChange={(e) => setBottle({ ...bottle, style: e.value })}
                                        options={styleOptions}
                                        placeholder="Select style"
                                        className="w-full"
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="col-12 md:col-6">
                                <div className="field">
                                    <label htmlFor="abv" className="block mb-2 font-medium">ABV (%)</label>
                                    <InputNumber
                                        id="abv"
                                        value={bottle.abv}
                                        onValueChange={(e) => setBottle({ ...bottle, abv: e.value ?? null })}
                                        placeholder="e.g., 43"
                                        suffix="%"
                                        min={0}
                                        max={100}
                                        className="w-full"
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="col-12 md:col-6">
                                <div className="field">
                                    <label htmlFor="volume" className="block mb-2 font-medium">Volume</label>
                                    <InputText
                                        id="volume"
                                        value={bottle.volume}
                                        onChange={(e) => setBottle({ ...bottle, volume: e.target.value })}
                                        placeholder="e.g., 750ml"
                                        className="w-full"
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="col-12 md:col-6">
                                <div className="field">
                                    <label htmlFor="price" className="block mb-2 font-medium">Price ($) *</label>
                                    <InputNumber
                                        id="price"
                                        value={bottle.price}
                                        onValueChange={(e) => setBottle({ ...bottle, price: e.value ?? null })}
                                        placeholder="e.g., 120"
                                        mode="currency"
                                        currency="USD"
                                        locale="en-US"
                                        className="w-full"
                                        disabled={!isEditing}
                                    />
                                    <small className="text-color-secondary">Used for settle-up calculations</small>
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="field">
                                    <label htmlFor="purchase_url" className="block mb-2 font-medium">Purchase Link (optional)</label>
                                    <InputText
                                        id="purchase_url"
                                        value={bottle.purchase_url}
                                        onChange={(e) => setBottle({ ...bottle, purchase_url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full"
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="col-12">
                                <div className="field">
                                    <label htmlFor="notes" className="block mb-2 font-medium">Tasting Notes / Description</label>
                                    <InputTextarea
                                        id="notes"
                                        value={bottle.notes}
                                        onChange={(e) => setBottle({ ...bottle, notes: e.target.value })}
                                        placeholder="Share your thoughts on this whiskey..."
                                        rows={4}
                                        className="w-full"
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>
                        </div>

                        <Divider />

                        <div className="flex justify-content-end gap-2">
                            {isEditing ? (
                                <>
                                    {existingSubmission && (
                                        <Button
                                            type="button"
                                            label="Cancel"
                                            icon="pi pi-times"
                                            className="p-button-outlined p-button-secondary"
                                            onClick={() => setIsEditing(false)}
                                        />
                                    )}
                                    <Button
                                        type="submit"
                                        label={saving ? 'Saving...' : (existingSubmission ? 'Update Bottle' : 'Submit Bottle')}
                                        icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                                        disabled={saving || !bottle.whiskey_name}
                                    />
                                </>
                            ) : (
                                <Button
                                    type="button"
                                    label="Edit Submission"
                                    icon="pi pi-pencil"
                                    onClick={() => setIsEditing(true)}
                                />
                            )}
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    )
}
