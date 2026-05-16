"use client";

import { useEffect } from "react";
import { useHeader } from "@/components/providers/HeaderProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PoWorkflowConfig } from "@/components/ops/po/PoWorkflowConfig";
import { PoOverview } from "@/components/ops/po/PoOverview";
import { PoMyRequests } from "@/components/ops/po/PoMyRequests";
import { PoWaitingApproval } from "@/components/ops/po/PoWaitingApproval";

export default function PurchaseOrderPage() {
    const { setHeaderInfo } = useHeader();

    useEffect(() => {
        setHeaderInfo("Purchase Orders", "Manage PO workflows, requests, and approvals.");
    }, [setHeaderInfo]);

    return (
        <div className="w-full h-full p-6 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-white border shadow-sm p-1">
                    <TabsTrigger value="overview">Purchase Order Details</TabsTrigger>
                    <TabsTrigger value="my-requests">My Requests</TabsTrigger>
                    <TabsTrigger value="approvals">Waiting for Approval</TabsTrigger>
                    <TabsTrigger value="workflows">Workflow Configuration</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-4">
                    <PoOverview />
                </TabsContent>
                
                <TabsContent value="my-requests" className="mt-4">
                    <PoMyRequests />
                </TabsContent>

                <TabsContent value="approvals" className="mt-4">
                    <PoWaitingApproval />
                </TabsContent>

                <TabsContent value="workflows" className="mt-4">
                    <PoWorkflowConfig />
                </TabsContent>
            </Tabs>
        </div>
    );
}
