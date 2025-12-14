import { useState, useEffect } from 'react'
import { Card } from 'primereact/card'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Dropdown } from 'primereact/dropdown'
import { Checkbox } from 'primereact/checkbox'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Message } from 'primereact/message'
import { AppLayout } from '../components/layout'
import { useEvents, useEventMemberships, useBottleSubmissions, useSettlements } from '../hooks/useData'
import { useAuth } from '../context'
import { SpendingSummary } from '../types'

export function SettleUp() {
    const { events, loading: eventsLoading } = useEvents()
    const { user, isAdmin } = useAuth()
    const [selectedEventId, setSelectedEventId] = useState<string | undefined>()
    
    // Get data for selected event
    const { memberships, loading: membershipsLoading } = useEventMemberships(selectedEventId)
    const { submissions, loading: submissionsLoading } = useBottleSubmissions(selectedEventId)
    const { settlements, loading: settlementsLoading, createOrUpdateSettlement } = useSettlements(selectedEventId)

    // Auto-select most recent active or completed event
    useEffect(() => {
        if (events.length > 0 && !selectedEventId) {
            const activeEvent = events.find(e => e.status === 'active' || e.status === 'completed')
            if (activeEvent) {
                setSelectedEventId(activeEvent.id)
            } else {
                setSelectedEventId(events[0].id)
            }
        }
    }, [events, selectedEventId])

    const loading = eventsLoading || membershipsLoading || submissionsLoading || settlementsLoading

    // Calculate spending summary - include all users with bottle submissions, not just memberships
    // Create a map of all unique participants (from both memberships and submissions)
    const participantsMap = new Map<string, { user_id: string; profile: Profile }>()
    
    // Add all members (with safety check)
    if (memberships) {
        memberships.forEach(m => {
            if (m.profile) {
                participantsMap.set(m.user_id, { user_id: m.user_id, profile: m.profile })
            }
        })
    }
    
    // Add all bottle submitters (even if not in memberships yet)
    if (submissions) {
        submissions.forEach(b => {
            if (b.user_id && b.profile && !participantsMap.has(b.user_id)) {
                participantsMap.set(b.user_id, { user_id: b.user_id, profile: b.profile })
            }
        })
    }
    
    const spendingSummary: SpendingSummary[] = Array.from(participantsMap.values()).map(participant => {
        const bottle = submissions?.find(b => b.user_id === participant.user_id)
        const amountSpent = bottle?.price || 0
        const settlement = settlements?.find(s => s.user_id === participant.user_id)
        
        return {
            user_id: participant.user_id,
            profile: participant.profile,
            amount_spent: amountSpent,
            average_target: 0, // Will calculate after
            balance: 0, // Will calculate after
            has_settled: settlement?.has_settled || false,
            settlement_id: settlement?.id
        }
    })

    // Calculate totals and averages
    const totalSpent = spendingSummary.reduce((sum, s) => sum + s.amount_spent, 0)
    const participantCount = spendingSummary.length
    const averageSpent = participantCount > 0 ? totalSpent / participantCount : 0

    // Debug logging
    console.log('SettleUp Debug:', {
        selectedEventId,
        membershipsCount: memberships?.length,
        submissionsCount: submissions?.length,
        participantCount,
        spendingSummary
    })

    // Update each participant's balance
    spendingSummary.forEach(s => {
        s.average_target = averageSpent
        s.balance = s.amount_spent - averageSpent
    })

    const handleSettlementToggle = async (userId: string, currentStatus: boolean) => {
        if (!user?.id) return
        
        try {
            await createOrUpdateSettlement(userId, !currentStatus, user.id)
        } catch (error) {
            console.error('Failed to update settlement:', error)
        }
    }

    const priceTemplate = (value: number) => `$${value.toFixed(2)}`

    const balanceTemplate = (row: SpendingSummary) => {
        const balance = row.balance
        const severity = balance > 0 ? 'success' : balance < 0 ? 'danger' : 'info'
        const label = balance > 0
            ? `+$${balance.toFixed(2)} (owed)`
            : balance < 0
                ? `-$${Math.abs(balance).toFixed(2)} (owes)`
                : 'Even'

        return <Tag value={label} severity={severity} />
    }

    const settlementTemplate = (row: SpendingSummary) => {
        if (!isAdmin) {
            return row.has_settled ? (
                <Tag value="Settled" severity="success" icon="pi pi-check" />
            ) : (
                <Tag value="Pending" severity="warning" icon="pi pi-clock" />
            )
        }

        return (
            <div className="flex align-items-center gap-2">
                <Checkbox
                    checked={row.has_settled}
                    onChange={() => handleSettlementToggle(row.user_id, row.has_settled)}
                />
                <span>{row.has_settled ? 'Settled' : 'Pending'}</span>
            </div>
        )
    }

    const eventOptions = events.map(e => ({
        label: `${e.name} (${e.year})`,
        value: e.id
    }))

    const selectedEvent = events.find(e => e.id === selectedEventId)

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="mb-2">Settle Up</h1>
                        <p className="text-color-secondary">Track spending and settlements for each event</p>
                    </div>
                    
                    {/* Event Year Selector */}
                    <Dropdown
                        value={selectedEventId}
                        options={eventOptions}
                        onChange={(e) => setSelectedEventId(e.value)}
                        placeholder="Select Event"
                        className="w-20rem"
                        disabled={eventsLoading}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                        <ProgressSpinner />
                    </div>
                ) : !selectedEvent ? (
                    <Message severity="info" text="No events found. Create an event to track spending." />
                ) : participantCount === 0 ? (
                    <Message severity="info" text="No participants in this event yet. Add members to track spending." />
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid mb-4">
                            <div className="col-12 md:col-3">
                                <Card className="text-center">
                                    <div className="text-color-secondary text-sm mb-2">Total Spent</div>
                                    <div className="text-3xl font-bold">${totalSpent.toFixed(2)}</div>
                                </Card>
                            </div>
                            <div className="col-12 md:col-3">
                                <Card className="text-center">
                                    <div className="text-color-secondary text-sm mb-2">Participants</div>
                                    <div className="text-3xl font-bold">{participantCount}</div>
                                </Card>
                            </div>
                            <div className="col-12 md:col-3">
                                <Card className="text-center border-primary border-2">
                                    <div className="text-color-secondary text-sm mb-2">Target Per Person</div>
                                    <div className="text-3xl font-bold text-primary">${averageSpent.toFixed(2)}</div>
                                </Card>
                            </div>
                            <div className="col-12 md:col-3">
                                <Card className="text-center">
                                    <div className="text-color-secondary text-sm mb-2">Settled</div>
                                    <div className="text-3xl font-bold">
                                        {spendingSummary.filter(s => s.has_settled).length}/{participantCount}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Participants Table */}
                        <Card className="mb-4">
                            <DataTable value={spendingSummary} stripedRows responsiveLayout="scroll">
                                <Column field="profile.name" header="Participant" sortable />
                                <Column 
                                    field="amount_spent" 
                                    header="Amount Spent" 
                                    body={(row) => priceTemplate(row.amount_spent)} 
                                    sortable 
                                />
                                <Column 
                                    field="average_target" 
                                    header="Target" 
                                    body={(row) => priceTemplate(row.average_target)} 
                                />
                                <Column 
                                    field="balance" 
                                    header="Balance" 
                                    body={balanceTemplate} 
                                    sortable 
                                />
                                <Column 
                                    field="has_settled" 
                                    header="Status" 
                                    body={settlementTemplate}
                                    sortable
                                />
                            </DataTable>
                        </Card>

                        {/* Info Box */}
                        <Card className="surface-100">
                            <div className="flex gap-3">
                                <i className="pi pi-info-circle text-xl text-primary" />
                                <div>
                                    <h4 className="mt-0 mb-2 text-primary">How Settlement Works</h4>
                                    <p className="m-0 text-color-secondary">
                                        At the end of the Advent season, participants who spent more than the average
                                        are owed money, while those who spent less owe the difference.
                                        {isAdmin && ' As an admin, you can mark participants as settled by checking the box.'}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </AppLayout>
    )
}

