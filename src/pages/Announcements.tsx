import { Card } from 'primereact/card'
import { Timeline } from 'primereact/timeline'
import { Avatar } from 'primereact/avatar'
import { AppLayout } from '../components/layout'

const announcements = [
    {
        id: 1,
        title: 'Bottle Distribution Day!',
        body: 'We\'ll be meeting at John\'s place on Saturday, November 25th at 2pm to distribute the mini bottles. Please bring your submission!',
        createdAt: '2024-11-20',
        createdBy: { name: 'Admin' }
    },
    {
        id: 2,
        title: 'Reminder: Submissions Due Friday',
        body: 'Please make sure to submit your bottle details by Friday so we can finalize the calendar assignments.',
        createdAt: '2024-11-15',
        createdBy: { name: 'Admin' }
    },
    {
        id: 3,
        title: 'Welcome to Whiskey Advent 2024!',
        body: 'Another year, another amazing collection of whiskeys to share. Can\'t wait to see what everyone brings this year!',
        createdAt: '2024-11-01',
        createdBy: { name: 'Admin' }
    }
]

export function Announcements() {
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

    const customContent = (item: typeof announcements[0]) => (
        <Card className="mb-3">
            <div className="flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                <h3 className="m-0">{item.title}</h3>
                <span className="text-color-secondary text-sm">{formatDate(item.createdAt)}</span>
            </div>
            <p className="line-height-3 text-color-secondary mb-3">{item.body}</p>
            <div className="flex align-items-center gap-2 pt-2 border-top-1 surface-border">
                <Avatar icon="pi pi-user" shape="circle" size="small" />
                <span className="text-color-secondary text-sm">{item.createdBy.name}</span>
            </div>
        </Card>
    )

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
