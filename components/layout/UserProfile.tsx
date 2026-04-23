"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User as UserIcon, LogOut, Settings, Lock, MessageSquare } from "lucide-react"

interface UserProfileProps {
    user?: {
        name: string;
        email: string;
        image?: string;
    } | null;
}

export function UserProfile({ user }: UserProfileProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [open, setOpen] = useState(false) // Edit Profile Modal
    const [unread, setUnread] = useState(0)

    useEffect(() => {
        if (!user) return;
        
        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/chat/unread');
                if (res.ok) {
                    const data = await res.json();
                    setUnread(data.unread || 0);
                }
            } catch (error) {
                // Ignore network errors on polling
            }
        };

        // Fetch immediately and then every 10 seconds globally
        fetchUnread();
        const interval = setInterval(fetchUnread, 10000);
        return () => clearInterval(interval);
    }, [user, pathname]);

    // Helpers
    const initials = user?.name
        ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : "U";

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" })
        router.push("/login")
        router.refresh()
    }

    if (!user) return null;

    return (
        <>
            <div className="flex items-center gap-3">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-full h-9 w-9"
                    onClick={() => router.push('/messages')}
                >
                    <MessageSquare className="h-5 w-5" />
                    {unread > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white"></span>
                        </span>
                    )}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-emerald-500/20 hover:ring-emerald-500/40 transition-all" suppressHydrationWarning>
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.image} alt={user.name} />
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">{initials}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none text-zinc-900">{user.name}</p>
                            <p className="text-xs leading-none text-zinc-500">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setOpen(true)} className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Edit Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-500 cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Profile Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit profile</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" defaultValue={user.name} disabled />
                            <p className="text-[10px] text-zinc-500">Contact admin to change display name.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                New Password <span className="text-xs text-zinc-400 font-normal">(Leave blank to keep current)</span>
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                                <Input id="password" type="password" className="pl-9" placeholder="••••••••" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="picture">Profile Picture URL</Label>
                            <Input id="picture" placeholder="https://..." defaultValue={user.image} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </div>
        </>
    )
}
