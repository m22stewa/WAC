import { Card } from 'primereact/card'
import { Timeline } from 'primereact/timeline'
import { Avatar } from 'primereact/avatar'
import { ProgressSpinner } from 'primereact/progressspinner'
import { AppLayout } from '../components/layout'
import { useAnnouncements, useCurrentEvent } from '../hooks'
import { Announcement } from '../types'

export function Announcements() {
    const { event, loading: eventLoading } = useCurrentEvent()
    const { announcements, loading: announcementsLoading } = useAnnouncements(event?.id)

    const loading = eventLoading || announcementsLoading

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const customMarker = () => (
        <span className="flex align-items-center justify-content-center bg-primary border-circle" style={{ width: '2rem', height: '2rem' }}>
            <i className="pi pi-megaphone text-white text-sm" />
        </span>
    )

    const customContent = (item: Announcement) => (
        <Card className="mb-3">
            <div className="flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                <h3 className="m-0">{item.title}</h3>
                <span className="text-color-secondary text-sm">{formatDate(item.created_at)}</span>
            </div>
            <p className="line-height-3 text-color-secondary mb-3">{item.body}</p>
            <div className="flex align-items-center gap-2 pt-2 border-top-1 surface-border">
                <Avatar icon="pi pi-user" shape="circle" size="normal" />
                <span className="text-color-secondary text-sm">{(item as any).profile?.name || 'Admin'}</span>
            </div>
        </Card>
    )

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
            <div className="max-w-3xl mx-auto">
                <h1 className="mb-2">📢 Announcements</h1>
                <p className="text-color-secondary mb-4">Updates and news from the organizers</p>

                {announcements.length === 0 ? (
                    <Card className="text-center p-5">
                        <div className="text-4xl mb-3">📭</div>
                        <h3>No Announcements</h3>
                        <p className="text-color-secondary">Check back later for updates from the organizers.</p>
                    </Card>
                ) : (
                    <Timeline value={announcements} content={customContent} marker={customMarker} />
                )}
            </div>
        </AppLayout>
    )
}
