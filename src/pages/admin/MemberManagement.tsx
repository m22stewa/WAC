import { useState, useRef } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { Avatar } from 'primereact/avatar'
import { Tag } from 'primereact/tag'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { AppLayout } from '../../components/layout'
import { useUsers } from '../../hooks'
import { Profile, UserRole } from '../../types'

const roleOptions = [
    { label: 'Member', value: 'user' },
    { label: 'Admin', value: 'admin' }
]

export function MemberManagement() {
    const { users, loading, updateUserRole } = useUsers()
    const toast = useRef<Toast>(null)

    const [showRoleDialog, setShowRoleDialog] = useState(false)
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
    const [newRole, setNewRole] = useState<UserRole>('user')

    const openRoleDialog = (user: Profile) => {
        setSelectedUser(user)
        setNewRole(user.role)
        setShowRoleDialog(true)
    }

    const handleRoleChange = async () => {
        if (!selectedUser) return

        try {
            await updateUserRole(selectedUser.id, newRole)
            toast.current?.show({ severity: 'success', summary: 'Success', detail: `${selectedUser.name}'s role updated to ${newRole}` })
            setShowRoleDialog(false)
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to update role' })
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

    const roleTemplate = (row: Profile) => (
        <Tag
            value={row.role === 'admin' ? '👑 Admin' : '🥃 Member'}
            severity={row.role === 'admin' ? 'warning' : 'info'}
        />
    )

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

    return (
        <AppLayout>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="max-w-5xl mx-auto">
                <div className="mb-4">
                    <h1 className="m-0 mb-1">👥 User Management</h1>
                    <p className="text-color-secondary m-0">View all users and manage their roles</p>
                </div>

                <Card>
                    <DataTable
                        value={users}
                        loading={loading}
                        stripedRows
                        responsiveLayout="scroll"
                        paginator
                        rows={10}
                        emptyMessage="No users found."
                    >
                        <Column header="User" body={memberTemplate} sortField="name" sortable />
                        <Column field="role" header="Role" body={roleTemplate} sortable style={{ width: '150px' }} />
                        <Column field="created_at" header="Joined" body={joinedTemplate} sortable style={{ width: '150px' }} />
                        <Column header="Actions" body={actionsTemplate} style={{ width: '100px' }} />
                    </DataTable>
                </Card>

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
