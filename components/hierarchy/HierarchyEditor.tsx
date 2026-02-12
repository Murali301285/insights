"use client"

import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    Controls,
    Background,
    Panel,
    Position,
    ReactFlowProvider,
    useReactFlow,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Button } from "@/components/ui/button";
import { Plus, Save, RotateCcw, Layout, Loader2 } from "lucide-react";
import { toast } from "sonner";
import CustomNode from './CustomNode';
import { EditHierarchyNodeSheet } from './EditHierarchyNodeSheet';

// Node Types
const nodeTypes = {
    custom: CustomNode,
};

// Layout Helper
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 80 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 300, height: 120 }); // Estimate card size
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Dagre layouts centered at (x, y), React Flow is top-left
        // We shift by half width/height
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // We shift slightly to center the node based on its actual generic size
        node.position = {
            x: nodeWithPosition.x - 150, // half of width
            y: nodeWithPosition.y - 60,  // half of height
        };

        return node;
    });

    return { nodes, edges };
};

interface HierarchyEditorProps {
    companyId: string;
    isReadOnly?: boolean;
}

function HierarchyEditorContent({ companyId, isReadOnly = false }: HierarchyEditorProps) {
    // Force height to ensure visibility
    const containerStyle = { width: '100%', height: '600px' };

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { getIntersectingNodes } = useReactFlow();

    // ... (fetchData logic same) ...

    const fetchData = useCallback(async () => {
        if (!companyId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/config/hierarchy?companyId=${companyId}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();

            // Transform API data to React Flow
            const flowNodes: Node[] = data.map((item: any) => ({
                id: item.id,
                type: 'custom',
                data: { ...item, isRoot: !item.parentId },
                position: { x: 0, y: 0 },
                draggable: !isReadOnly, // Disable dragging
            }));

            // ... (edges logic) ...

            const flowEdges: Edge[] = data
                .filter((item: any) => item.parentId)
                .map((item: any) => ({
                    id: `e-${item.parentId}-${item.id}`,
                    source: item.parentId,
                    target: item.id,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#94a3b8', strokeWidth: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#94a3b8',
                    },
                }));

            const layouted = getLayoutedElements(flowNodes, flowEdges);
            setNodes(layouted.nodes);
            setEdges(layouted.edges);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load hierarchy");
        } finally {
            setIsLoading(false);
        }
    }, [companyId, setNodes, setEdges, isReadOnly]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onNodeClick = (_: React.MouseEvent, node: Node) => {
        if (isReadOnly) return; // View-only: Disable click for now (or open read-only sheet later)
        setSelectedNode(node.data);
        setIsSheetOpen(true);
    };

    const handleAddRoot = () => {
        setSelectedNode(null);
        setIsSheetOpen(true);
    };

    const handleLayout = useCallback(() => {
        const layouted = getLayoutedElements(nodes, edges);
        setNodes([...layouted.nodes]);
        setEdges([...layouted.edges]);
    }, [nodes, edges, setNodes, setEdges]);

    // ...

    const onNodeDragStop = async (_: React.MouseEvent, node: Node) => {
        if (isReadOnly) return;

        // ... (rest of logic) ...
        // ... (rest of logic) ...
        const intersections = getIntersectingNodes(node);
        const potentialParent = intersections.find(n => n.id !== node.id);

        if (potentialParent) {
            // ...
            if (potentialParent.id === node.data.parentId) return;

            const confirmMove = window.confirm(`Move '${node.data.title}' to under '${potentialParent.data.title}'?`);
            if (confirmMove) {
                // ... API call ...
                try {
                    const res = await fetch("/api/config/hierarchy", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: node.id, parentId: potentialParent.id })
                    });

                    if (!res.ok) throw new Error("Reparenting led to cycle or error");
                    toast.success("Position moved successfully");
                    fetchData();
                } catch (err) {
                    toast.error("Failed to move position (Cycle detected?)");
                }
            } else {
                handleLayout();
            }
        }
    };

    // ... return ...

    return (
        <div style={containerStyle} className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden shadow-sm relative group">
            {/* ... ReactFlow ... */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={!isReadOnly} // Global setting
                nodesConnectable={!isReadOnly}
            >
                <Background color="#e4e4e7" gap={16} />
                <Controls className="bg-white border-zinc-200 shadow-sm" />

                <Panel position="top-right" className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleLayout} className="bg-white/80 backdrop-blur">
                        <Layout className="w-4 h-4 mr-2" />
                        Reset Layout
                    </Button>
                    {!isReadOnly && (
                        <Button size="sm" onClick={handleAddRoot} className="bg-violet-600 hover:bg-violet-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Position
                        </Button>
                    )}
                </Panel>

                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                    </div>
                )}
            </ReactFlow>

            {/* Sheet only relevant if editing allowed */}
            {!isReadOnly && (
                <EditHierarchyNodeSheet
                    isOpen={isSheetOpen}
                    onClose={() => setIsSheetOpen(false)}
                    node={selectedNode}
                    companyId={companyId}
                    onSave={fetchData}
                />
            )}
        </div>
    );
};

export default function HierarchyEditor(props: HierarchyEditorProps) {
    return (
        <ReactFlowProvider>
            <HierarchyEditorContent {...props} />
        </ReactFlowProvider>
    );
}
