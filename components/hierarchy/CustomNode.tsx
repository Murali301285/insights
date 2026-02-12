import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User, Briefcase, Mail, Phone, MapPin } from "lucide-react";

const CustomNode = ({ data }: { data: any }) => {
    return (
        <div className="relative group">
            {/* Connection Handles */}
            <Handle type="target" position={Position.Top} className="!bg-zinc-400 !w-3 !h-3 !-mt-1" />

            {/* Card Content */}
            <div className={cn(
                "w-64 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-violet-200/50",
                data.isRoot ? "border-violet-500/30 ring-4 ring-violet-500/5" : "border-zinc-200/50"
            )}>
                {/* Header (Role) */}
                <div className={cn(
                    "px-4 py-2 flex items-center justify-between border-b",
                    data.isRoot
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent"
                        : "bg-gradient-to-r from-slate-700 to-slate-800 text-white border-transparent"
                )}>
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-white/70" />
                        <span className="text-xs font-bold uppercase tracking-wider text-white">
                            {data.title || "Position Title"}
                        </span>
                    </div>
                </div>

                {/* Body (Person) */}
                <div className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-2 ring-zinc-50">
                        <AvatarImage src={data.photo} alt={data.name} />
                        <AvatarFallback className="bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-500 font-bold">
                            {data.name?.charAt(0) || <User className="w-5 h-5 text-zinc-300" />}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-zinc-900 truncate">{data.name || "Vacant Position"}</h3>
                        <p className="text-xs text-zinc-500 truncate">{data.email || "No email assigned"}</p>
                    </div>
                </div>

                {/* Footer (Actions/Info) */}
                {/* Only show if details are present for cleaner look */}
                {(data.phone || data.location) && (
                    <div className="px-4 py-2 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
                        {data.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[80px]">{data.location}</span>
                            </div>
                        )}
                        {data.phone && (
                            <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>Extend</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-zinc-400 !w-3 !h-3 !-mb-1" />
        </div>
    );
};

export default memo(CustomNode);
