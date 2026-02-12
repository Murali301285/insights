import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface HierarchyNode {
    id?: string;
    title: string;
    name?: string;
    email?: string;
    photo?: string; // URL or Base64
    parentId?: string | null;
}

interface EditSheetProps {
    isOpen: boolean;
    onClose: () => void;
    node: HierarchyNode | null;
    companyId: string; // Required for new nodes
    onSave: () => void; // Trigger refresh
}

export function EditHierarchyNodeSheet({ isOpen, onClose, node, companyId, onSave }: EditSheetProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<HierarchyNode>>({})

    useEffect(() => {
        if (node) {
            setFormData(node)
        } else {
            setFormData({ title: "", name: "", email: "", photo: "" })
        }
    }, [node, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const isNew = !formData.id
            const method = isNew ? "POST" : "PUT"

            // If new, ensure we include parentId if it was passed (e.g. adding child)
            // But currently the sheet is just for editing selected or add new root?
            // Usually "Add Child" is a specific action. 
            // For now, let's assume this sheet handles basic edits.
            // If adding new, we might need parentId passed in props or formData.

            const payload = { ...formData, companyId }

            const res = await fetch("/api/config/hierarchy", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error("Failed to save")

            toast.success(isNew ? "Position created" : "Position updated")
            onSave()
            onClose()
        } catch (error) {
            toast.error("An error occurred")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!formData.id) return
        if (!confirm("Are you sure? This will remove the position.")) return

        setIsLoading(true)
        try {
            const res = await fetch(`/api/config/hierarchy?id=${formData.id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete")
            toast.success("Position removed")
            onSave()
            onClose()
        } catch (error) {
            toast.error("Failed to delete")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{formData.id ? "Edit Position" : "New Position"}</SheetTitle>
                    <SheetDescription>
                        Configure the details for this position in the hierarchy.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div className="space-y-2">
                        <Label>Position Title (Role)</Label>
                        <Input
                            value={formData.title || ""}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Chief Technology Officer"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Employee Name</Label>
                        <Input
                            value={formData.name || ""}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Jane Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input
                            value={formData.email || ""}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="jane@company.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Photo URL</Label>
                        <Input
                            value={formData.photo || ""}
                            onChange={e => setFormData({ ...formData, photo: e.target.value })}
                            placeholder="https://..."
                        />
                        <p className="text-[10px] text-zinc-400">Enter a public URL for the profile photo.</p>
                    </div>

                    <SheetFooter className="flex justify-between items-center mt-8">
                        {formData.id && (
                            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
