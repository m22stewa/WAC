import { useState, useRef, useMemo } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { Avatar } from 'primereact/avatar'
import { Tag } from 'primereact/tag'
import { Toast } from 'primereact/toast'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { AppLayout } from '../../components/layout'
import { useUsers } from '../../hooks'
import { Profile, UserRole } from '../../types'

const roleOptions = [
    { label: 'Member', value: 'user' },
    { label: 'Admin', value: 'admin' },
    { label: 'Waiting List', value: 'waiting_list' }
]

export function MemberManagement() {
    const { users, loading, updateUserRole, updateWaitingListOrder } = useUsers()
    const toast = useRef<Toast>(null)

    const [showRoleDialog, setShowRoleDialog] = useState(false)
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
    const [newRole, setNewRole] = useState<UserRole>('user')

    // Separate active users from waiting list
    const activeUsers = useMemo(() => 
        users.filter(u => u.role !== 'waiting_list').sort((a, b) => (a.name || '').localeCompare(b.name || '')),
        [users]
    )

    const waitingListUsers = useMemo(() => 
        users.filter(u => u.role === 'waiting_list').sort((a, b) => (a.waiting_list_order || 0) - (b.waiting_list_order || 0)),
        [users]
    )

    const openRoleDialog = (user: Profile) => {
        setSelectedUser(user)
        setNewRole(user.role)
        setShowRoleDialog(true)
    }

    const handleRoleChange = async () => {
        if (!selectedUser) return

        try {
            await updateUserRole(selectedUser.id, newRole)
            const roleLabel = roleOptions.find(r => r.value === newRole)?.label || newRole
            toast.current?.show({ severity: 'success', summary: 'Success', detail: `${selectedUser.name}'s role updated to ${roleLabel}` })
            setShowRoleDialog(false)
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to update role' })
        }
    }

    const moveWaitingListUser = async (user: Profile, direction: 'up' | 'down') => {
        const currentIndex = waitingListUsers.findIndex(u => u.id === user.id)
        if (currentIndex === -1) return
        
        if (direction === 'up' && currentIndex === 0) return
        if (direction === 'down' && currentIndex === waitingListUsers.length - 1) return

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
        const reordered = [...waitingListUsers]
        const [movedUser] = reordered.splice(currentIndex, 1)
        reordered.splice(newIndex, 0, movedUser)

        // Update order for all affected users
        const updates = reordered.map((u, idx) => ({ id: u.id, order: idx }))
        
        try {
            await updateWaitingListOrder(updates)
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Waiting list order updated' })
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to update waiting list order' })
        }
    }

    const memberTemplate = (row: Profile) => (
        <div className="flex align-items-center gap-2">
            <Avatar
                image={row.avatar_url || undefined}
                icon={!row.avatar_url ? 'pi pi-user' : undefined}
                shape="circle"
            />
            <div>
                <div className="font-bold">{row.name || 'Unnamed User'}</div>
                <div className="text-color-secondary text-sm">{row.email}</div>
            </div>
        </div>
    )

    const roleTemplate = (row: Profile) => {
        const config = {
            admin: { label: 'Admin', severity: 'warning' as const },
            user: { label: 'Member', severity: 'info' as const },
            waiting_list: { label: 'Waiting List', severity: 'secondary' as const }
        }
        const { label, severity } = config[row.role] || config.user
        return <Tag value={label} severity={severity} />
    }

    const joinedTemplate = (row: Profile) => {
        return new Date(row.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const actionsTemplate = (row: Profile) => (
        <Button
            icon="pi pi-user-edit"
            className="p-button-text p-button-sm"
            onClick={() => openRoleDialog(row)}
            tooltip="Change Role"
        />
    )

    const waitingListActionsTemplate = (row: Profile) => {
        const currentIndex = waitingListUsers.findIndex(u => u.id === row.id)
        const isFirst = currentIndex === 0
        const isLast = currentIndex === waitingListUsers.length - 1

        return (
            <div className="flex gap-1">
                <Button
                    icon="pi pi-arrow-up"
                    className="p-button-text p-button-sm"
                    onClick={() => moveWaitingListUser(row, 'up')}
                    disabled={isFirst}
                    tooltip="Move Up"
                />
                <Button
                    icon="pi pi-arrow-down"
                    className="p-button-text p-button-sm"
                    onClick={() => moveWaitingListUser(row, 'down')}
                    disabled={isLast}
                    tooltip="Move Down"
                />
                <Button
                    icon="pi pi-user-edit"
                    className="p-button-text p-button-sm"
                    onClick={() => openRoleDialog(row)}
                    tooltip="Change Role"
                />
            </div>
        )
    }

    const positionTemplate = (_row: Profile, options: any) => {
        return <span className="font-bold">#{options.rowIndex + 1}</span>
    }

    return (
        <AppLayout>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="max-w-5xl mx-auto">
                <div className="mb-4">
                    <h1 className="m-0 mb-1">User Management</h1>
                    <p className="text-color-secondary m-0">View all users and manage their roles</p>
                </div>

                {/* Active Members Table */}
                <Card className="mb-4">
                    <h3 className="mt-0 mb-3">Active Members</h3>
                    <DataTable
                        value={activeUsers}
                        loading={loading}
                        stripedRows
                        responsiveLayout="scroll"
                        paginator
                        rows={10}
                        emptyMessage="No active members found."
                    >
                        <Column header="User" body={memberTemplate} sortField="name" sortable />
                        <Column field="role" header="Role" body={roleTemplate} sortable style={{ width: '150px' }} />
                        <Column field="created_at" header="Joined" body={joinedTemplate} sortable style={{ width: '150px' }} />
                        <Column header="Actions" body={actionsTemplate} style={{ width: '100px' }} />
                    </DataTable>
                </Card>

                {/* Waiting List Table */}
                {waitingListUsers.length > 0 && (
                    <Card>
                        <h3 className="mt-0 mb-3">Waiting List</h3>
                        <DataTable
                            value={waitingListUsers}
                            loading={loading}
                            stripedRows
                            responsiveLayout="scroll"
                            emptyMessage="No users on waiting list."
                        >
                            <Column header="#" body={positionTemplate} style={{ width: '60px' }} />
                            <Column header="User" body={memberTemplate} />
                            <Column field="created_at" header="Joined" body={joinedTemplate} style={{ width: '150px' }} />
                            <Column header="Actions" body={waitingListActionsTemplate} style={{ width: '150px' }} />
                        </DataTable>
                    </Card>
                )}

                <Dialog
                    header="Change User Role"
                    visible={showRoleDialog}
                    onHide={() => setShowRoleDialog(false)}
                    style={{ width: '400px' }}
                >
                    <div className="flex flex-column gap-3 pt-3">
                        {selectedUser && (
                            <>
                                <div className="flex align-items-center gap-3 p-3 surface-100 border-round">
                                    <Avatar
                                        image={selectedUser.avatar_url || undefined}
                                        icon={!selectedUser.avatar_url ? 'pi pi-user' : undefined}
                                        size="large"
                                        shape="circle"
                                    />
                                    <div>
                                        <div className="font-bold text-lg">{selectedUser.name}</div>
                                        <div className="text-color-secondary">{selectedUser.email}</div>
                                    </div>
                                </div>

                                <div className="field">
                                    <label htmlFor="role" className="block mb-2 font-medium">Select Role</label>
                                    <Dropdown
                                        id="role"
                                        value={newRole}
                                        options={roleOptions}
                                        onChange={(e) => setNewRole(e.value)}
                                        className="w-full"
                                    />
                                    <small className="text-color-secondary mt-2 block">
                                        {newRole === 'admin'
                                            ? 'Admins can manage events, announcements, users, and all content.'
                                            : newRole === 'waiting_list'
                                            ? 'Waiting list users cannot participate until promoted to Member.'
                                            : 'Members can view content, submit bottles, and add tasting notes.'}
                                    </small>
                                </div>
                            </>
                        )}

                        <div className="flex justify-content-end gap-2 mt-3">
                            <Button label="Cancel" className="p-button-text" onClick={() => setShowRoleDialog(false)} />
                            <Button
                                label="Save Role"
                                icon="pi pi-check"
                                onClick={handleRoleChange}
                                disabled={selectedUser?.role === newRole}
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        </AppLayout>
    )
}

