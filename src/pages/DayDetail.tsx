import { useParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import { Rating } from 'primereact/rating'
import { Checkbox } from 'primereact/checkbox'
import { Avatar } from 'primereact/avatar'
import { Divider } from 'primereact/divider'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Toast } from 'primereact/toast'
import { Image } from 'primereact/image'
import { AppLayout } from '../components/layout'
import { useAuth } from '../context'
import { useCurrentEvent, useCalendarDays, useComments, useTastingEntry, useTastingEntries } from '../hooks'

export function DayDetail() {
    const { dayNumber } = useParams()
    const { user } = useAuth()
    const toast = useRef<Toast>(null)

    const { event, loading: eventLoading } = useCurrentEvent()
    const { days, loading: daysLoading } = useCalendarDays(event?.id)

    // Find the specific day
    const day = days.find(d => d.day_number === Number(dayNumber))
    const bottle = day?.bottle_submission as any

    // Hooks for comments and tasting entry
    const { comments, loading: commentsLoading, createComment } = useComments(day?.id)
    const { entry, saveEntry } = useTastingEntry(day?.id, user?.id)
    const { averageRating, ratingCount } = useTastingEntries(day?.id)

    // Local state for form
    const [rating, setRating] = useState<number | undefined>(undefined)
    const [notes, setNotes] = useState('')
    const [wouldBuyAgain, setWouldBuyAgain] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [saving, setSaving] = useState(false)
    const [posting, setPosting] = useState(false)

    // Sync local state with fetched entry
    useEffect(() => {
        if (entry) {
            setRating(entry.rating ?? undefined)
            setNotes(entry.tasting_notes ?? '')
            setWouldBuyAgain(entry.would_buy_again ?? false)
        }
    }, [entry])

    const loading = eventLoading || daysLoading

    const handleSaveNotes = async () => {
        setSaving(true)
        try {
            await saveEntry({
                rating: rating ?? null,
                tasting_notes: notes || null,
                would_buy_again: wouldBuyAgain
            })
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Your tasting notes have been saved' })
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save notes' })
        } finally {
            setSaving(false)
        }
    }

    const handlePostComment = async () => {
        if (!newComment.trim() || !user) return
        setPosting(true)
        try {
            await createComment(newComment.trim(), user.id)
            setNewComment('')
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to post comment' })
        } finally {
            setPosting(false)
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'just now'
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
        return date.toLocaleDateString()
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

    if (!day) {
        return (
            <AppLayout>
                <div className="max-w-4xl mx-auto text-center p-5">
                    <i className="pi pi-calendar text-4xl text-color-secondary mb-3" />
                    <h2>Day Not Found</h2>
                    <p className="text-color-secondary">This calendar day hasn't been set up yet.</p>
                </div>
            </AppLayout>
        )
    }

    // Check if day is revealed (manually or by date)
    const todayStr = new Date().toISOString().split('T')[0]
    const isRevealed = day.is_revealed || (day.reveal_date && day.reveal_date <= todayStr)

    if (!isRevealed) {
        return (
            <AppLayout>
                <div className="max-w-4xl mx-auto text-center p-5">
                    <i className="pi pi-lock text-4xl text-color-secondary mb-3" />
                    <h2>Day {dayNumber} - Not Yet Revealed</h2>
                    <p className="text-color-secondary">Check back when this day is revealed!</p>
                </div>
            </AppLayout>
        )
    }

    if (!bottle) {
        return (
            <AppLayout>
                <div className="max-w-4xl mx-auto text-center p-5">
                    <i className="pi pi-box text-4xl text-color-secondary mb-3" />
                    <h2>Day {dayNumber}</h2>
                    <p className="text-color-secondary">No bottle has been assigned to this day yet.</p>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <Toast ref={toast} />
            <div className="max-w-4xl mx-auto">
                <div className="mb-4">
                    <span className="bg-primary text-white px-3 py-1 border-round text-sm font-bold">Day {dayNumber}</span>
                    <h1 className="mt-2 mb-1">{bottle.whiskey_name}</h1>
                    <div className="flex align-items-center gap-3">
                        <p className="text-color-secondary mt-0 mb-0">Submitted by {bottle.profile?.name || 'Unknown'}</p>
                        {averageRating !== null && (
                            <div className="flex align-items-center gap-2">
                                <Rating value={Math.round(averageRating)} readOnly cancel={false} stars={10} />
                                <span className="text-color-secondary">
                                    {averageRating.toFixed(1)} ({ratingCount} rating{ratingCount !== 1 ? 's' : ''})
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid">
                    <div className="col-12 lg:col-8">
                        {/* Whiskey Details */}
                        <Card className="mb-4">
                            {bottle.image_url && (
                                <div className="mb-4 text-center">
                                    <Image 
                                        src={bottle.image_url} 
                                        alt={bottle.whiskey_name}
                                        width="300"
                                        preview
                                        className="border-round shadow-2"
                                    />
                                </div>
                            )}
                            <div className="flex align-items-center gap-4 mb-3">
                                <div className="flex flex-wrap gap-3">
                                    {bottle.country && <span><i className="pi pi-map-marker mr-1" />{bottle.country}</span>}
                                    {bottle.style && <span><i className="pi pi-tag mr-1" />{bottle.style}</span>}
                                    {bottle.abv && <span><strong>{bottle.abv}%</strong> ABV</span>}
                                    {bottle.price && <span className="text-primary font-bold">${bottle.price}</span>}
                                </div>
                            </div>
                            {bottle.purchase_url && (
                                <div className="mb-3">
                                    <Button 
                                        label="Purchase Online" 
                                        icon="pi pi-shopping-cart" 
                                        className="p-button-outlined"
                                        onClick={() => window.open(bottle.purchase_url, '_blank')}
                                    />
                                </div>
                            )}
                            {bottle.notes && (
                                <>
                                    <Divider />
                                    <h3 className="text-color-secondary text-sm mt-0 mb-2">About this whiskey</h3>
                                    <p className="line-height-3 m-0">{bottle.notes}</p>
                                </>
                            )}
                        </Card>

                        {/* Comments Section */}
                        <Card>
                            <h3 className="mt-0">Discussion ({comments.length})</h3>

                            <div className="flex flex-column gap-2 mb-3">
                                <InputTextarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    rows={2}
                                    className="w-full"
                                />
                                <div className="flex justify-content-end">
                                    <Button
                                        label="Post Comment"
                                        icon={posting ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
                                        size="small"
                                        disabled={!newComment.trim() || posting}
                                        onClick={handlePostComment}
                                    />
                                </div>
                            </div>

                            <Divider />

                            {commentsLoading ? (
                                <div className="text-center p-3">
                                    <ProgressSpinner style={{ width: '30px', height: '30px' }} />
                                </div>
                            ) : comments.length === 0 ? (
                                <p className="text-color-secondary text-center">No comments yet. Be the first to share your thoughts!</p>
                            ) : (
                                <div className="flex flex-column gap-3">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar icon="pi pi-user" shape="circle" />
                                            <div className="flex-1">
                                                <div className="flex align-items-center gap-2 mb-1">
                                                    <span className="font-bold">{(comment as any).profile?.name || 'User'}</span>
                                                    <span className="text-color-secondary text-sm">{formatTime(comment.created_at)}</span>
                                                </div>
                                                <p className="m-0 text-color-secondary">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="col-12 lg:col-4">
                        {/* Tasting Notes Form */}
                        <Card>
                            <h3 className="mt-0">Your Private Tasting Notes</h3>
                            <p className="text-color-secondary text-sm mt-0 mb-3">Only you can see your notes</p>

                            <div className="field mb-3">
                                <label className="block mb-2 font-medium">Your Rating</label>
                                <Rating
                                    value={rating}
                                    onChange={(e) => setRating(e.value ?? undefined)}
                                    cancel={false}
                                    stars={10}
                                />
                                <small className="text-color-secondary block mt-1">Shared as part of average rating</small>
                            </div>

                            <div className="field mb-3">
                                <label htmlFor="tasting-notes" className="block mb-2 font-medium">Private Notes</label>
                                <InputTextarea
                                    id="tasting-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="What flavors did you notice? (private)"
                                    rows={4}
                                    className="w-full"
                                />
                                <small className="text-color-secondary block mt-1">Only visible to you</small>
                            </div>

                            <div className="field mb-4">
                                <div className="flex align-items-center gap-2">
                                    <Checkbox
                                        inputId="wouldBuy"
                                        checked={wouldBuyAgain}
                                        onChange={(e) => setWouldBuyAgain(e.checked ?? false)}
                                    />
                                    <label htmlFor="wouldBuy">Would buy again</label>
                                </div>
                            </div>

                            <Button
                                label={saving ? 'Saving...' : 'Save Notes'}
                                icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-save'}
                                className="w-full"
                                onClick={handleSaveNotes}
                                disabled={saving}
                            />
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
