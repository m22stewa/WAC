import { useState } from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Avatar } from 'primereact/avatar'
import { useAuth, useTheme } from '../context'
import { AppLayout } from '../components/layout'

export function Profile() {
    const { profile, updateProfile } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [name, setName] = useState(profile?.name || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        await updateProfile({ name })
        setSaving(false)
    }

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto">
                <h1 className="mb-2">Profile</h1>
                <p className="text-color-secondary mb-4">Manage your account settings</p>

                <div className="grid">
                    {/* Profile Info */}
                    <div className="col-12">
                        <Card className="mb-4">
                            <div className="flex align-items-center gap-4">
                                <Avatar
                                    image={profile?.avatar_url || undefined}
                                    icon={!profile?.avatar_url ? 'pi pi-user' : undefined}
                                    size="xlarge"
                                    shape="circle"
                                    className="border-3 border-primary"
                                />
                                <div>
                                    <h2 className="m-0 mb-1">{profile?.name || 'User'}</h2>
                                    <p className="text-color-secondary m-0 mb-2">{profile?.email}</p>
                                    <span className={`px-2 py-1 border-round text-sm font-bold ${profile?.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'surface-200'
                                        }`}>
                                        {profile?.role === 'admin' ? 'Admin' : 'Member'}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Edit Profile */}
                    <div className="col-12 md:col-6">
                        <Card className="h-full">
                            <h3 className="mt-0 mb-3">Edit Profile</h3>

                            <div className="field mb-3">
                                <label htmlFor="name" className="block mb-2 font-medium">Display Name</label>
                                <InputText
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div className="field mb-4">
                                <label htmlFor="email" className="block mb-2 font-medium">Email</label>
                                <InputText
                                    id="email"
                                    value={profile?.email || ''}
                                    disabled
                                    className="w-full"
                                />
                                <small className="text-color-secondary">Email cannot be changed</small>
                            </div>

                            <Button
                                label={saving ? 'Saving...' : 'Save Changes'}
                                icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-save'}
                                onClick={handleSave}
                                disabled={saving || name === profile?.name}
                            />
                        </Card>
                    </div>

                    {/* Preferences */}
                    <div className="col-12 md:col-6">
                        <Card className="h-full">
                            <h3 className="mt-0 mb-3">Preferences</h3>

                            <div className="flex justify-content-between align-items-center p-3 surface-100 border-round">
                                <div>
                                    <span className="font-bold block">Theme</span>
                                    <span className="text-color-secondary text-sm">
                                        {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                                    </span>
                                </div>
                                <Button
                                    icon={theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'}
                                    className="p-button-outlined"
                                    onClick={toggleTheme}
                                />
                            </div>
                        </Card>
                    </div>

                    {/* Stats */}
                    <div className="col-12">
                        <Card>
                            <h3 className="mt-0 mb-3">Your Stats</h3>

                            <div className="grid">
                                <div className="col-6 md:col-3">
                                    <div className="text-center p-3 surface-100 border-round">
                                        <div className="text-2xl font-bold text-primary">2</div>
                                        <div className="text-color-secondary text-sm">Events Joined</div>
                                    </div>
                                </div>
                                <div className="col-6 md:col-3">
                                    <div className="text-center p-3 surface-100 border-round">
                                        <div className="text-2xl font-bold text-primary">2</div>
                                        <div className="text-color-secondary text-sm">Bottles Submitted</div>
                                    </div>
                                </div>
                                <div className="col-6 md:col-3">
                                    <div className="text-center p-3 surface-100 border-round">
                                        <div className="text-2xl font-bold text-primary">15</div>
                                        <div className="text-color-secondary text-sm">Tastings Logged</div>
                                    </div>
                                </div>
                                <div className="col-6 md:col-3">
                                    <div className="text-center p-3 surface-100 border-round">
                                        <div className="text-2xl font-bold text-primary">8</div>
                                        <div className="text-color-secondary text-sm">Comments Made</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
