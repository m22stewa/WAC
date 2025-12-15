import { useState, useRef } from 'react'
import { Card } from 'primereact/card'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { ProgressSpinner } from 'primereact/progressspinner'
import { AppLayout } from '../../components/layout'
import { useEvents } from '../../hooks'
import { supabase } from '../../lib/supabase'

export function Export() {
    const toast = useRef<Toast>(null)
    const { events, loading: eventsLoading } = useEvents()
    
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
    const [exporting, setExporting] = useState(false)

    const eventOptions = events.map(event => ({
        label: `${event.year} - ${event.name}`,
        value: event.id
    }))

    const handleExport = async () => {
        if (!selectedEventId) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'No Event Selected', 
                detail: 'Please select a calendar year to export' 
            })
            return
        }

        setExporting(true)
        try {
            const event = events.find(e => e.id === selectedEventId)
            if (!event) throw new Error('Event not found')

            // Fetch all data for this event
            const [
                { data: memberships },
                { data: bottles },
                { data: settlements },
                { data: days },
                { data: tastingEntries },
                { data: comments }
            ] = await Promise.all([
                supabase.from('event_memberships').select('*, profile:profiles(*)').eq('event_id', selectedEventId),
                supabase.from('bottle_submissions').select('*, profile:profiles(*)').eq('event_id', selectedEventId),
                supabase.from('settlements').select('*, profile:profiles(*)').eq('event_id', selectedEventId),
                supabase.from('calendar_days').select('*, bottle_submission:bottle_submissions(*)').eq('event_id', selectedEventId),
                supabase.from('tasting_entries').select('*, calendar_day:calendar_days!inner(event_id), profile:profiles(*)').eq('calendar_day.event_id', selectedEventId),
                supabase.from('comments').select('*, calendar_day:calendar_days!inner(event_id), profile:profiles(*)').eq('calendar_day.event_id', selectedEventId)
            ])

            // Create CSV sections
            const csvSections: string[] = []

            // Event Info
            csvSections.push(`EVENT INFORMATION`)
            csvSections.push(`Year,Name,Start Date,End Date`)
            csvSections.push(`${event.year},"${event.name}",${event.start_date || 'N/A'},${event.end_date || 'N/A'}`)
            csvSections.push('')

            // Members
            csvSections.push(`MEMBERS`)
            csvSections.push(`Name,Email,Role`)
            memberships?.forEach(m => {
                const profile = m.profile as any
                csvSections.push(`"${profile?.name || 'Unknown'}","${profile?.email || 'N/A'}","${profile?.role || 'user'}"`)
            })
            csvSections.push('')

            // Bottles
            csvSections.push(`BOTTLE SUBMISSIONS`)
            csvSections.push(`Submitted By,Whiskey Name,Distillery,Country,Style,ABV,Volume,Price,Purchase URL,Notes`)
            bottles?.forEach(b => {
                const profile = b.profile as any
                csvSections.push(`"${profile?.name || 'Unknown'}","${b.whiskey_name}","${b.distillery || ''}","${b.country || ''}","${b.style || ''}",${b.abv || ''},"${b.volume || ''}",${b.price || ''},"${b.purchase_url || ''}","${(b.notes || '').replace(/"/g, '""')}"`)
            })
            csvSections.push('')

            // Settlements
            csvSections.push(`SETTLE UP`)
            csvSections.push(`Name,Amount Owed,Settled`)
            settlements?.forEach(s => {
                const profile = s.profile as any
                csvSections.push(`"${profile?.name || 'Unknown'}",${s.amount_owed || 0},${s.settled ? 'Yes' : 'No'}`)
            })
            csvSections.push('')

            // Calendar Days
            csvSections.push(`CALENDAR DAYS`)
            csvSections.push(`Day,Reveal Date,Revealed,Assigned Bottle`)
            days?.forEach(d => {
                const bottle = d.bottle_submission as any
                csvSections.push(`${d.day_number},${d.reveal_date || 'N/A'},${d.is_revealed ? 'Yes' : 'No'},"${bottle?.whiskey_name || 'Not Assigned'}"`)
            })
            csvSections.push('')

            // Tasting Entries
            csvSections.push(`TASTING ENTRIES`)
            csvSections.push(`Day,User,Rating,Would Buy Again,Notes`)
            tastingEntries?.forEach(t => {
                const profile = t.profile as any
                const day = t.calendar_day as any
                csvSections.push(`${day?.day_number || 'N/A'},"${profile?.name || 'Unknown'}",${t.rating || 'N/A'},${t.would_buy_again ? 'Yes' : 'No'},"${(t.tasting_notes || '').replace(/"/g, '""')}"`)
            })
            csvSections.push('')

            // Comments
            csvSections.push(`COMMENTS`)
            csvSections.push(`Day,User,Comment,Posted At`)
            comments?.forEach(c => {
                const profile = c.profile as any
                const day = c.calendar_day as any
                const date = new Date(c.created_at).toLocaleString()
                csvSections.push(`${day?.day_number || 'N/A'},"${profile?.name || 'Unknown'}","${(c.comment || '').replace(/"/g, '""')}","${date}"`)
            })

            // Create and download CSV
            const csvContent = csvSections.join('\n')
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            
            link.setAttribute('href', url)
            link.setAttribute('download', `WAC_${event.year}_Export_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.current?.show({ 
                severity: 'success', 
                summary: 'Export Complete', 
                detail: `Data for ${event.year} has been exported successfully` 
            })
        } catch (error) {
            console.error('Export error:', error)
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Export Failed', 
                detail: error instanceof Error ? error.message : 'Failed to export data' 
            })
        } finally {
            setExporting(false)
        }
    }

    if (eventsLoading) {
        return (
            <AppLayout>
                <div className="flex align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
                    <ProgressSpinner />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <Toast ref={toast} />
            <div className="max-w-3xl mx-auto">
                <h1 className="mb-4">Export Data</h1>

                <Card>
                    <p className="text-color-secondary mb-4">
                        Export all data for a specific calendar year including members, bottles, settlements, 
                        calendar days, tasting entries, and comments to a CSV file.
                    </p>

                    <div className="field mb-4">
                        <label htmlFor="event" className="block mb-2 font-bold">Select Calendar Year</label>
                        <Dropdown
                            id="event"
                            value={selectedEventId}
                            options={eventOptions}
                            onChange={(e) => setSelectedEventId(e.value)}
                            placeholder="Choose a year to export"
                            className="w-full"
                        />
                    </div>

                    <Button
                        label="Export to CSV"
                        icon={exporting ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
                        onClick={handleExport}
                        disabled={!selectedEventId || exporting}
                        className="w-full"
                    />

                    <div className="mt-4 p-3 surface-100 border-round">
                        <h3 className="mt-0 mb-2 text-sm">Export Includes:</h3>
                        <ul className="mt-0 mb-0 text-sm line-height-3">
                            <li>Event information (year, name, dates)</li>
                            <li>All members and their roles</li>
                            <li>Complete bottle submission details</li>
                            <li>Settlement status and amounts</li>
                            <li>Calendar day assignments</li>
                            <li>All tasting entries and ratings</li>
                            <li>Comments and discussions</li>
                        </ul>
                    </div>
                </Card>
            </div>
        </AppLayout>
    )
}
