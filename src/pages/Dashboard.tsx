import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context'
import { AppLayout } from '../components/layout'
import { useCurrentEvent, useCalendarDays } from '../hooks'

const CURRENT_YEAR = new Date().getFullYear()

export function Dashboard() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const currentMonth = new Date().getMonth()
    const isDecember = currentMonth === 11

    const { event, loading: eventLoading } = useCurrentEvent()
    const { days, loading: daysLoading } = useCalendarDays(event?.id)

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD format

    // Build calendar days from real data, or fallback to empty structure
    const calendarDays = days.length > 0
        ? days.map(day => {
            // A day is revealed if is_revealed is true OR if the reveal_date has passed
            const revealDatePassed = day.reveal_date && day.reveal_date <= todayStr
            return {
                day: day.day_number,
                isRevealed: day.is_revealed || revealDatePassed,
                isToday: day.day_number === today.getDate() && isDecember,
                hasBottle: !!day.bottle_submission_id
            }
        })
        : Array.from({ length: 24 }, (_, i) => ({
            day: i + 1,
            isRevealed: false,
            isToday: i + 1 === today.getDate() && isDecember,
            hasBottle: false
        }))

    const loading = eventLoading || daysLoading

    if (loading) {
        return (
            <AppLayout>
                <div className="flex align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="max-w-screen-xl mx-auto">
                <h1 className="mb-2">
                    Welcome back, <span className="text-primary">{profile?.name || 'Friend'}</span>!
                </h1>
                <p className="text-color-secondary mb-4">
                    {isDecember
                        ? "It's the most wonderful time of the year! 🎄"
                        : "The countdown to whiskey season begins soon!"}
                </p>

                {/* Quick Actions */}
                <div className="grid mb-4">
                    <div className="col-12 md:col-4">
                        <Card className="h-full">
                            <div className="text-center">
                                <i className="pi pi-star text-4xl text-primary mb-3" />
                                <h3 className="mt-0">My Bottle</h3>
                                <p className="text-color-secondary">Submit or view your whiskey contribution</p>
                                <Button
                                    label="View Details"
                                    icon="pi pi-arrow-right"
                                    iconPos="right"
                                    className="p-button-text"
                                    onClick={() => navigate('/my-bottle')}
                                />
                            </div>
                        </Card>
                    </div>

                    <div className="col-12 md:col-4">
                        <Card className="h-full">
                            <div className="text-center">
                                <i className="pi pi-wallet text-4xl text-primary mb-3" />
                                <h3 className="mt-0">Settle Up</h3>
                                <p className="text-color-secondary">Check your spending balance</p>
                                <Button
                                    label="View Balance"
                                    icon="pi pi-arrow-right"
                                    iconPos="right"
                                    className="p-button-text"
                                    onClick={() => navigate('/settle-up')}
                                />
                            </div>
                        </Card>
                    </div>

                    <div className="col-12 md:col-4">
                        <Card className="h-full">
                            <div className="text-center">
                                <i className="pi pi-megaphone text-4xl text-primary mb-3" />
                                <h3 className="mt-0">Announcements</h3>
                                <p className="text-color-secondary">Latest updates from the organizers</p>
                                <Button
                                    label="Read More"
                                    icon="pi pi-arrow-right"
                                    iconPos="right"
                                    className="p-button-text"
                                    onClick={() => navigate('/announcements')}
                                />
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Advent Calendar Grid */}
                <h2 className="mb-3">🗓️ Advent Calendar {CURRENT_YEAR}</h2>
                <div className="grid">
                    {calendarDays.map(({ day, isRevealed, isToday }) => (
                        <div key={day} className="col-6 sm:col-4 md:col-2">
                            <Card
                                className={`text-center cursor-pointer ${isToday ? 'border-primary border-2' : ''} ${!isRevealed ? 'opacity-60' : ''}`}
                                onClick={() => isRevealed && navigate(`/day/${day}`)}
                            >
                                <div className="text-2xl font-bold">{day}</div>
                                {isRevealed ? (
                                    <i className="pi pi-check-circle text-green-500 mt-2" />
                                ) : (
                                    <i className="pi pi-lock text-color-secondary mt-2" />
                                )}
                                {isToday && <div className="text-xs text-primary mt-1">Today!</div>}
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    )
}
