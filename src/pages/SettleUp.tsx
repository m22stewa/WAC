import { Card } from 'primereact/card'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { AppLayout } from '../components/layout'

const CURRENT_YEAR = new Date().getFullYear()

const participants = [
    { id: 1, name: 'Alice Johnson', amountSpent: 150 },
    { id: 2, name: 'Bob Smith', amountSpent: 95 },
    { id: 3, name: 'Charlie Brown', amountSpent: 120 },
    { id: 4, name: 'Diana Prince', amountSpent: 180 },
    { id: 5, name: 'Eve Wilson', amountSpent: 110 }
]

export function SettleUp() {
    const totalSpent = participants.reduce((sum, p) => sum + p.amountSpent, 0)
    const averageSpent = totalSpent / participants.length

    const dataWithBalance = participants.map(p => ({
        ...p,
        averageTarget: averageSpent,
        balance: p.amountSpent - averageSpent
    }))

    const priceTemplate = (value: number) => `$${value.toFixed(2)}`

    const balanceTemplate = (row: typeof dataWithBalance[0]) => {
        const balance = row.balance
        const severity = balance > 0 ? 'success' : balance < 0 ? 'danger' : 'info'
        const label = balance > 0
            ? `+$${balance.toFixed(2)} (owed)`
            : balance < 0
                ? `-$${Math.abs(balance).toFixed(2)} (owes)`
                : 'Even'

        return <Tag value={label} severity={severity} />
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="mb-2">💰 Settle Up</h1>
                <p className="text-color-secondary mb-4">{CURRENT_YEAR} Advent Calendar spending overview</p>

                {/* Summary Cards */}
                <div className="grid mb-4">
                    <div className="col-12 md:col-4">
                        <Card className="text-center">
                            <div className="text-color-secondary text-sm mb-2">Total Spent</div>
                            <div className="text-3xl font-bold">${totalSpent.toFixed(2)}</div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-4">
                        <Card className="text-center">
                            <div className="text-color-secondary text-sm mb-2">Participants</div>
                            <div className="text-3xl font-bold">{participants.length}</div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-4">
                        <Card className="text-center border-primary border-2">
                            <div className="text-color-secondary text-sm mb-2">Target Per Person</div>
                            <div className="text-3xl font-bold text-primary">${averageSpent.toFixed(2)}</div>
                        </Card>
                    </div>
                </div>

                {/* Participants Table */}
                <Card className="mb-4">
                    <DataTable value={dataWithBalance} stripedRows responsiveLayout="scroll">
                        <Column field="name" header="Participant" sortable />
                        <Column field="amountSpent" header="Amount Spent" body={(row) => priceTemplate(row.amountSpent)} sortable />
                        <Column field="averageTarget" header="Target" body={(row) => priceTemplate(row.averageTarget)} />
                        <Column field="balance" header="Balance" body={balanceTemplate} sortable />
                    </DataTable>
                </Card>

                {/* Info Box */}
                <Card className="surface-100">
                    <div className="flex gap-3">
                        <i className="pi pi-info-circle text-xl text-primary" />
                        <div>
                            <h4 className="mt-0 mb-2 text-primary">How Settlement Works</h4>
                            <p className="m-0 text-color-secondary">
                                At the end of the Advent season, participants who spent more than the average
                                are owed money, while those who spent less owe the difference.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    )
}
