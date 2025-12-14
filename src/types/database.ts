// Database entity types for the Whiskey Advent Calendar app

export type UserRole = 'user' | 'admin'
export type EventStatus = 'planned' | 'active' | 'completed'

export interface Profile {
    id: string
    name: string | null
    email: string
    avatar_url: string | null
    role: UserRole
    created_at: string
}

export interface Event {
    id: string
    name: string
    year: number
    start_date: string
    end_date: string
    description: string | null
    status: EventStatus
    created_by: string
    created_at: string
}

export interface EventMembership {
    id: string
    event_id: string
    user_id: string
    role_override: UserRole | null
    created_at: string
    // Joined fields
    profile?: Profile
    event?: Event
}

export interface BottleSubmission {
    id: string
    event_id: string
    user_id: string | null
    whiskey_name: string
    distillery: string | null
    country: string | null
    style: string | null
    abv: number | null
    volume: string | null
    price: number | null
    purchase_url: string | null
    notes: string | null
    created_at: string
    // Joined fields
    profile?: Profile
}

export interface CalendarDay {
    id: string
    event_id: string
    day_number: number
    bottle_submission_id: string | null
    reveal_date: string
    is_revealed: boolean
    // Joined fields
    bottle_submission?: BottleSubmission
}

export interface TastingEntry {
    id: string
    calendar_day_id: string
    user_id: string
    rating: number | null
    tasting_notes: string | null
    would_buy_again: boolean | null
    created_at: string
    updated_at: string
    // Joined fields
    profile?: Profile
}

export interface Comment {
    id: string
    calendar_day_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
    // Joined fields
    profile?: Profile
}

export interface Announcement {
    id: string
    event_id: string
    title: string
    body: string | null
    created_by: string
    created_at: string
    // Joined fields
    profile?: Profile
}

// Form types for creating/updating entities
export interface BottleSubmissionForm {
    whiskey_name: string
    distillery: string
    country: string
    style: string
    abv: number | null
    volume: string
    price: number | null
    purchase_url: string
    notes: string
}

export interface TastingEntryForm {
    rating: number
    tasting_notes: string
    would_buy_again: boolean
}

export interface CommentForm {
    content: string
}

export interface EventForm {
    name: string
    year: number
    start_date: Date
    end_date: Date
    description: string
}

export interface AnnouncementForm {
    title: string
    body: string
}

// Spending/Settlement calculation types
export interface SpendingSummary {
    user_id: string
    profile: Profile
    amount_spent: number
    average_target: number
    balance: number // positive = owed money, negative = owes money
}
