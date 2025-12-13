import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Event, BottleSubmission, CalendarDay, Announcement, Profile, EventMembership } from '../types'

// Hook for fetching events
export function useEvents() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchEvents = async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('year', { ascending: false })

        if (error) {
            console.error('Error fetching events:', error)
            setError(error.message)
        } else {
            console.log('Fetched events:', data)
            setEvents(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchEvents()
    }, [])

    const createEvent = async (event: Partial<Event>) => {
        console.log('Creating event:', event)
        const { data, error } = await supabase.from('events').insert(event).select().single()
        if (error) {
            console.error('Error creating event:', error)
            throw error
        }
        console.log('Created event:', data)
        setEvents(prev => [data, ...prev])
        return data
    }

    const updateEvent = async (id: string, updates: Partial<Event>) => {
        console.log('Updating event:', id, updates)
        const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single()
        if (error) {
            console.error('Error updating event:', error)
            throw error
        }
        setEvents(prev => prev.map(e => e.id === id ? data : e))
        return data
    }

    const deleteEvent = async (id: string) => {
        console.log('Deleting event:', id)
        const { error } = await supabase.from('events').delete().eq('id', id)
        if (error) {
            console.error('Error deleting event:', error)
            throw error
        }
        setEvents(prev => prev.filter(e => e.id !== id))
    }

    return { events, loading, error, fetchEvents, createEvent, updateEvent, deleteEvent }
}

// Hook for fetching announcements
export function useAnnouncements(eventId?: string) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAnnouncements = async () => {
        setLoading(true)
        setError(null)

        let query = supabase
            .from('announcements')
            .select('*, profile:profiles(name, avatar_url)')
            .order('created_at', { ascending: false })

        if (eventId) {
            query = query.eq('event_id', eventId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching announcements:', error)
            setError(error.message)
        } else {
            console.log('Fetched announcements:', data)
        }

        setAnnouncements(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchAnnouncements()
    }, [eventId])

    const createAnnouncement = async (announcement: Partial<Announcement>) => {
        console.log('Creating announcement:', announcement)
        const { data, error } = await supabase.from('announcements').insert(announcement).select().single()
        if (error) {
            console.error('Error creating announcement:', error)
            throw error
        }
        setAnnouncements(prev => [data, ...prev])
        return data
    }

    const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
        const { data, error } = await supabase.from('announcements').update(updates).eq('id', id).select().single()
        if (error) {
            console.error('Error updating announcement:', error)
            throw error
        }
        setAnnouncements(prev => prev.map(a => a.id === id ? data : a))
        return data
    }

    const deleteAnnouncement = async (id: string) => {
        const { error } = await supabase.from('announcements').delete().eq('id', id)
        if (error) {
            console.error('Error deleting announcement:', error)
            throw error
        }
        setAnnouncements(prev => prev.filter(a => a.id !== id))
    }

    return { announcements, loading, error, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement }
}

// Hook for fetching all users (admin only)
export function useUsers() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchUsers = async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.from('profiles').select('*').order('name')

        if (error) {
            console.error('Error fetching users:', error)
            setError(error.message)
        } else {
            console.log('Fetched users:', data)
        }

        setUsers(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const updateUserRole = async (userId: string, role: 'user' | 'admin') => {
        console.log('Updating user role:', userId, role)
        const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId).select().single()
        if (error) {
            console.error('Error updating user role:', error)
            throw error
        }
        setUsers(prev => prev.map(u => u.id === userId ? data : u))
        return data
    }

    return { users, loading, error, fetchUsers, updateUserRole }
}

// Hook for bottle submissions
export function useBottleSubmissions(eventId?: string) {
    const [submissions, setSubmissions] = useState<BottleSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSubmissions = async () => {
        if (!eventId) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
            .from('bottle_submissions')
            .select('*, profile:profiles(name, avatar_url)')
            .eq('event_id', eventId)

        if (error) {
            console.error('Error fetching submissions:', error)
            setError(error.message)
        } else {
            console.log('Fetched submissions:', data)
        }

        setSubmissions(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchSubmissions()
    }, [eventId])

    const createSubmission = async (submission: Partial<BottleSubmission>) => {
        console.log('Creating submission:', submission)
        const { data, error } = await supabase.from('bottle_submissions').insert(submission).select().single()
        if (error) {
            console.error('Error creating submission:', error)
            throw error
        }
        setSubmissions(prev => [...prev, data])
        return data
    }

    const updateSubmission = async (id: string, updates: Partial<BottleSubmission>) => {
        const { data, error } = await supabase.from('bottle_submissions').update(updates).eq('id', id).select().single()
        if (error) {
            console.error('Error updating submission:', error)
            throw error
        }
        setSubmissions(prev => prev.map(s => s.id === id ? data : s))
        return data
    }

    return { submissions, loading, error, fetchSubmissions, createSubmission, updateSubmission }
}

// Hook for calendar days
export function useCalendarDays(eventId?: string) {
    const [days, setDays] = useState<CalendarDay[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDays = async () => {
        if (!eventId) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
            .from('calendar_days')
            .select('*, bottle_submission:bottle_submissions(*, profile:profiles(name))')
            .eq('event_id', eventId)
            .order('day_number')

        if (error) {
            console.error('Error fetching calendar days:', error)
            setError(error.message)
        } else {
            console.log('Fetched calendar days:', data)
        }

        setDays(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchDays()
    }, [eventId])

    const updateDay = async (id: string, updates: Partial<CalendarDay>) => {
        const { data, error } = await supabase.from('calendar_days').update(updates).eq('id', id).select().single()
        if (error) {
            console.error('Error updating calendar day:', error)
            throw error
        }
        await fetchDays() // Refetch to get joined data
        return data
    }

    const createDaysForEvent = async (eventId: string, startDate: Date) => {
        console.log('Creating days for event:', eventId, startDate)
        const days = Array.from({ length: 24 }, (_, i) => ({
            event_id: eventId,
            day_number: i + 1,
            reveal_date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            is_revealed: false
        }))

        const { error } = await supabase.from('calendar_days').insert(days)
        if (error) {
            console.error('Error creating calendar days:', error)
            throw error
        }
        await fetchDays()
    }

    return { days, loading, error, fetchDays, updateDay, createDaysForEvent }
}

// Hook for event memberships
export function useEventMemberships(eventId?: string) {
    const [memberships, setMemberships] = useState<EventMembership[]>([])
    const [loading, setLoading] = useState(true)

    const fetchMemberships = async () => {
        if (!eventId) {
            setLoading(false)
            return
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('event_memberships')
            .select('*, profile:profiles(*)')
            .eq('event_id', eventId)

        if (error) {
            console.error('Error fetching memberships:', error)
        }

        setMemberships(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchMemberships()
    }, [eventId])

    const addMember = async (userId: string) => {
        if (!eventId) return
        const { data, error } = await supabase
            .from('event_memberships')
            .insert({ event_id: eventId, user_id: userId })
            .select('*, profile:profiles(*)')
            .single()
        if (error) {
            console.error('Error adding member:', error)
            throw error
        }
        setMemberships(prev => [...prev, data])
        return data
    }

    const removeMember = async (membershipId: string) => {
        const { error } = await supabase.from('event_memberships').delete().eq('id', membershipId)
        if (error) {
            console.error('Error removing member:', error)
            throw error
        }
        setMemberships(prev => prev.filter(m => m.id !== membershipId))
    }

    return { memberships, loading, fetchMemberships, addMember, removeMember }
}

// Get current year's event
export function useCurrentEvent() {
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCurrentEvent = async () => {
            const currentYear = new Date().getFullYear()
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('year', currentYear)
                .single()

            if (error) {
                console.log('No event for current year:', error.message)
            } else {
                console.log('Current event:', data)
            }

            setEvent(data || null)
            setLoading(false)
        }
        fetchCurrentEvent()
    }, [])

    return { event, loading }
}
