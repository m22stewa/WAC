import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import { Rating } from 'primereact/rating'
import { Checkbox } from 'primereact/checkbox'
import { Avatar } from 'primereact/avatar'
import { Divider } from 'primereact/divider'
import { AppLayout } from '../components/layout'

export function DayDetail() {
    const { dayNumber } = useParams()
    const [rating, setRating] = useState<number | undefined>(undefined)
    const [notes, setNotes] = useState('')
    const [wouldBuyAgain, setWouldBuyAgain] = useState(false)
    const [newComment, setNewComment] = useState('')

    const whiskey = {
        name: 'Lagavulin 16 Year',
        distillery: 'Lagavulin',
        country: 'Scotland',
        style: 'Single Malt Scotch',
        abv: 43,
        price: 120,
        notes: 'A bold, smoky Islay malt with notes of peat, iodine, and gentle sweetness.',
        submittedBy: { name: 'John Doe' }
    }

    const comments = [
        { id: 1, user: { name: 'Alice' }, content: 'This is incredible! The smokiness is perfect.', createdAt: '2 hours ago' },
        { id: 2, user: { name: 'Bob' }, content: 'One of my favorites from this year!', createdAt: '1 hour ago' }
    ]

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-4">
                    <span className="bg-primary text-white px-3 py-1 border-round text-sm font-bold">Day {dayNumber}</span>
                    <h1 className="mt-2 mb-1">{whiskey.name}</h1>
                    <p className="text-color-secondary mt-0">Submitted by {whiskey.submittedBy.name}</p>
                </div>

                <div className="grid">
                    <div className="col-12 lg:col-8">
                        {/* Whiskey Details */}
                        <Card className="mb-4">
                            <div className="flex align-items-center gap-4 mb-3">
                                <span className="text-5xl">🥃</span>
                                <div className="flex flex-wrap gap-3">
                                    <span><i className="pi pi-map-marker mr-1" />{whiskey.country}</span>
                                    <span><i className="pi pi-tag mr-1" />{whiskey.style}</span>
                                    <span><strong>{whiskey.abv}%</strong> ABV</span>
                                    <span className="text-primary font-bold">${whiskey.price}</span>
                                </div>
                            </div>
                            <Divider />
                            <h3 className="text-color-secondary text-sm mt-0 mb-2">About this whiskey</h3>
                            <p className="line-height-3 m-0">{whiskey.notes}</p>
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
                                        icon="pi pi-send"
                                        size="small"
                                        disabled={!newComment.trim()}
                                    />
                                </div>
                            </div>

                            <Divider />

                            <div className="flex flex-column gap-3">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                        <Avatar icon="pi pi-user" shape="circle" />
                                        <div className="flex-1">
                                            <div className="flex align-items-center gap-2 mb-1">
                                                <span className="font-bold">{comment.user.name}</span>
                                                <span className="text-color-secondary text-sm">{comment.createdAt}</span>
                                            </div>
                                            <p className="m-0 text-color-secondary">{comment.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <div className="col-12 lg:col-4">
                        {/* Tasting Notes Form */}
                        <Card>
                            <h3 className="mt-0">Your Tasting Notes</h3>

                            <div className="field mb-3">
                                <label className="block mb-2 font-medium">Your Rating</label>
                                <Rating
                                    value={rating}
                                    onChange={(e) => setRating(e.value ?? undefined)}
                                    cancel={false}
                                    stars={10}
                                />
                            </div>

                            <div className="field mb-3">
                                <label htmlFor="tasting-notes" className="block mb-2 font-medium">Notes</label>
                                <InputTextarea
                                    id="tasting-notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="What flavors did you notice?"
                                    rows={4}
                                    className="w-full"
                                />
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

                            <Button label="Save Notes" icon="pi pi-save" className="w-full" />
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
