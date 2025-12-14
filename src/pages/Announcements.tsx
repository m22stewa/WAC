import { Card } from 'primereact/card'
import { Avatar } from 'primereact/avatar'
import { ProgressSpinner } from 'primereact/progressspinner'
import { AppLayout } from '../components/layout'
import { useAnnouncements, useCurrentEvent } from '../hooks'

export function Announcements() {
    const { event, loading: eventLoading } = useCurrentEvent()
    const { announcements, loading: announcementsLoading } = useAnnouncements(event?.id)

    const loading = eventLoading || announcementsLoading

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    }

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
                <h1 className="mb-2">Announcements</h1>
                <p className="text-color-secondary mb-4">Updates and news from the organizers</p>

                {announcements.length === 0 ? (
                    <Card className="text-center p-5">
                        <div className="text-4xl mb-3">📭</div>
                        <h3>No Announcements</h3>
                        <p className="text-color-secondary">Check back later for updates from the organizers.</p>
                    </Card>
                ) : (
                    <div className="flex flex-column gap-4">
                        {announcements.map((announcement) => (
                            <Card key={announcement.id}>
                                <div className="flex align-items-start gap-3 mb-3">
                                    <Avatar icon="pi pi-user" shape="circle" size="large" />
                                    <div className="flex-1">
                                        <div className="flex justify-content-between align-items-start flex-wrap gap-2">
                                            <span className="font-semibold">{(announcement as any).profile?.name || 'Admin'}</span>
                                            <span className="text-color-secondary text-sm">{formatDate(announcement.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                                <h2 className="mt-0 mb-3">{announcement.title}</h2>
                                <p className="line-height-3 text-color-secondary m-0" style={{ whiteSpace: 'pre-wrap' }}>{announcement.body}</p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
