"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Pencil, Trash2, ShieldAlert, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Step = {
    id?: string;
    stepOrder: number;
    userId: string;
    autoActionType: string;
    autoActionHours: number | null;
    user?: any;
};

type Workflow = {
    id: string;
    name: string;
    companyId: string;
    company: { id: string; name: string };
    isActive: boolean;
    steps: Step[];
    _count?: { requests: number };
};

export function PoWorkflowConfig() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [companies, setCompanies] = useState<{id: string, name: string}[]>([]);
    const [users, setUsers] = useState<{id: string, firstName: string, lastName: string, email: string}[]>([]);
    
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editData, setEditData] = useState<Workflow | null>(null);
    
    const [companyId, setCompanyId] = useState("");
    const [name, setName] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [steps, setSteps] = useState<Step[]>([]);

    useEffect(() => {
        fetchData();
        fetch("/api/companies").then(r => r.json()).then(setCompanies).catch(console.error);
        fetch("/api/users").then(r => r.json()).then(setUsers).catch(console.error);
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/ops/po/workflow");
            if (res.ok) setWorkflows(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setEditData(null);
        setCompanyId("");
        setName("");
        setIsActive(true);
        setSteps([{ stepOrder: 1, userId: "", autoActionType: "NA", autoActionHours: null }]);
    };

    const openEdit = (wf: Workflow) => {
        setEditData(wf);
        setCompanyId(wf.companyId);
        setName(wf.name);
        setIsActive(wf.isActive);
        setSteps(wf.steps.map(s => ({
            id: s.id,
            stepOrder: s.stepOrder,
            userId: s.userId,
            autoActionType: s.autoActionType,
            autoActionHours: s.autoActionHours
        })));
        setIsAddOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate
        if (!companyId || !name || steps.length === 0) {
            toast.error("Please fill in all required fields.");
            return;
        }

        const userIds = steps.map(s => s.userId);
        if (userIds.some(id => !id)) {
            toast.error("Please select a user for all steps.");
            return;
        }

        if (new Set(userIds).size !== userIds.length) {
            toast.error("A user cannot be assigned to multiple steps in the same workflow.");
            return;
        }

        const payload = {
            id: editData?.id,
            companyId,
            name,
            isActive,
            steps
        };

        try {
            const method = editData ? "PUT" : "POST";
            const res = await fetch("/api/ops/po/workflow", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(`Workflow ${editData ? 'updated' : 'created'} successfully.`);
                setIsAddOpen(false);
                fetchData();
            } else {
                const err = await res.json();
                // We show this nicely as a toast, but you can also make it a custom dialog if preferred.
                toast.error(err.error || "Operation failed", { duration: 5000 });
            }
        } catch (err) {
            toast.error("An error occurred.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this workflow?")) return;
        try {
            const res = await fetch(`/api/ops/po/workflow?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Workflow deleted");
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to delete");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const addStep = () => {
        setSteps([...steps, { stepOrder: steps.length + 1, userId: "", autoActionType: "NA", autoActionHours: null }]);
    };

    const removeStep = (index: number) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        // Re-order
        setSteps(newSteps.map((s, i) => ({ ...s, stepOrder: i + 1 })));
    };

    const updateStep = (index: number, field: keyof Step, value: any) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const columns: ColumnDef<Workflow>[] = [
        { accessorKey: "company.name", header: "Company" },
        { accessorKey: "name", header: "Workflow Name", cell: ({row}) => <span className="font-semibold">{row.original.name}</span> },
        { id: "steps", header: "Total Steps", cell: ({ row }) => row.original.steps.length },
        { id: "pending", header: "Active Pending POs", cell: ({ row }) => <span className="font-mono bg-zinc-100 px-2 py-1 rounded">{row.original._count?.requests || 0}</span> },
        { accessorKey: "isActive", header: "Status", cell: ({ row }) => <span className={row.original.isActive ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>{row.original.isActive ? "Active" : "Inactive"}</span> },
        { id: "actions", cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openEdit(row.original)} className="text-blue-700">
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ) }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <h2 className="text-lg font-bold text-zinc-800">Workflow Configurations</h2>
                <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={resetForm} className="bg-zinc-900 text-white hover:bg-zinc-800"><Plus className="w-4 h-4 mr-2" /> New Workflow</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl hidden-scrollbar max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl">{editData ? "Edit Workflow" : "Create Workflow"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Company <span className="text-red-500">*</span></Label>
                                    <Select value={companyId} onValueChange={setCompanyId}>
                                        <SelectTrigger><SelectValue placeholder="Select Company" /></SelectTrigger>
                                        <SelectContent>
                                            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Workflow Name <span className="text-red-500">*</span></Label>
                                    <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. CapEx Approvals" />
                                </div>
                            </div>

                            <div className="border rounded-lg p-4 bg-zinc-50 space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-zinc-700">Approval Steps</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={addStep}><Plus className="w-4 h-4 mr-1"/> Add Step</Button>
                                </div>

                                {steps.map((step, index) => (
                                    <div key={index} className="flex gap-4 items-end bg-white p-3 border rounded shadow-sm relative">
                                        <div className="absolute -left-2 -top-2 bg-zinc-800 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                                            {index + 1}
                                        </div>
                                        
                                        <div className="space-y-1 flex-1">
                                            <Label className="text-xs">Approver User</Label>
                                            <Select value={step.userId} onValueChange={v => updateStep(index, 'userId', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select User" /></SelectTrigger>
                                                <SelectContent>
                                                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="space-y-1 w-32">
                                            <Label className="text-xs">Auto Action</Label>
                                            <Select value={step.autoActionType} onValueChange={v => updateStep(index, 'autoActionType', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="NA">N/A</SelectItem>
                                                    <SelectItem value="APPROVE">Auto Approve</SelectItem>
                                                    <SelectItem value="CANCEL">Auto Cancel</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {step.autoActionType !== "NA" && (
                                            <div className="space-y-1 w-24">
                                                <Label className="text-xs">Hours</Label>
                                                <Input type="number" min="1" value={step.autoActionHours || ""} onChange={e => updateStep(index, 'autoActionHours', e.target.value)} placeholder="hrs" />
                                            </div>
                                        )}

                                        {steps.length > 1 && (
                                            <Button type="button" variant="ghost" onClick={() => removeStep(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-10 w-10">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center border-t pt-4">
                                <div className="flex items-center space-x-2">
                                    <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                                    <Label htmlFor="active">Workflow is Active</Label>
                                </div>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Workflow</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <div className="bg-white rounded-xl border p-2 shadow-sm">
                <DataTable columns={columns} data={workflows} searchKey="name" />
            </div>
        </div>
    );
}
