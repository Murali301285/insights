"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Search, Download, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    rowClassName?: (row: TData) => string
    reportName?: string
    fileName?: string
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey = "name",
    rowClassName,
    reportName = "Data Report",
    fileName = "insight-export",
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    })

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination,
        },
    })

    const handleExport = async () => {
        const rows = table.getFilteredRowModel().rows;
        if (rows.length === 0) return;

        // Extract headers
        const exportableColumns = columns.filter((c: any) => 
            (c.accessorKey || c.id || c.accessorFn) && 
            c.id !== 'actions' && 
            c.id !== 'action' &&
            c.id !== 'index' &&
            c.id !== 'select' &&
            c.accessorKey !== 'actions' &&
            c.accessorKey !== 'action'
        );

        const headers = exportableColumns.map((c: any) => 
            c.header && typeof c.header === 'string' ? c.header : (c.accessorKey || c.id)
        );

        headers.unshift("Sl No");

        // Prepare Excel Workbook
        const ExcelJS = (await import('exceljs')).default;
        const fileSaver = await import('file-saver');
        const saveAs = fileSaver.saveAs || (fileSaver.default && (fileSaver.default.saveAs || fileSaver.default)) || fileSaver;

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(reportName.substring(0, 31)); // Max 31 chars for sheet name

        // Add Report Name in Row 1
        const titleRow = sheet.addRow([reportName]);
        titleRow.font = { bold: true, size: 14 };
        sheet.mergeCells(1, 1, 1, headers.length);
        titleRow.getCell(1).alignment = { horizontal: 'center' };

        // Add Headers in Row 2
        const headerRow = sheet.addRow(headers);
        headerRow.font = { bold: true };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF3F4F6' } // Light gray background
            };
            cell.border = {
                bottom: { style: 'thin' }
            };
        });
        
        // Add Data
        rows.forEach((row, index) => {
            const rowData: any[] = [index + 1]; // Sl No
            
            exportableColumns.forEach((c: any) => {
                let val: any = '';
                if (c.accessorFn) {
                    val = c.accessorFn(row.original, row.index);
                } else if (c.accessorKey) {
                    val = (row.original as any)[c.accessorKey];
                }

                if (val === null || val === undefined) val = "";
                else if (typeof val === 'object') val = JSON.stringify(val);
                else val = String(val);

                // Try converting to number if possible for better excel formatting, unless it starts with 0
                if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '' && !val.startsWith('0')) {
                    val = Number(val);
                }

                rowData.push(val);
            });
            sheet.addRow(rowData);
        });

        // Auto-fit columns
        sheet.columns.forEach((column) => {
            let maxLength = 0;
            if (column && column.eachCell) {
                column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                    if (rowNumber === 1) return; // Ignore title row
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
                column.width = Math.min(Math.max(maxLength + 2, 10), 100);
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const finalFileName = `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`;
        saveAs(blob, finalFileName);
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder={`Search ${searchKey}...`}
                            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn(searchKey)?.setFilterValue(event.target.value)
                            }
                            className="pl-8 max-w-sm h-9"
                        />
                    </div>
                </div>

                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                    <p className="text-sm text-zinc-500">Rows per page</p>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value))
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 50, 100].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                            <SelectItem value={`${data.length}`}>All</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1 ml-2 text-zinc-600">
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="rounded-md border border-zinc-200 bg-white overflow-auto max-h-[calc(100vh-300px)] custom-hover-scrollbar relative">
                <Table className="relative min-w-max">
                    <TableHeader className="sticky top-0 z-30 bg-zinc-50 shadow-sm shadow-zinc-200/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === headerGroup.headers.length - 1;
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={cn(
                                                "whitespace-nowrap font-semibold bg-zinc-50",
                                                isFirst ? "sticky left-0 z-40 bg-zinc-50 border-r border-zinc-100" : "",
                                                isLast ? "sticky right-0 z-40 bg-zinc-50 border-l border-zinc-100" : ""
                                            )}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={rowClassName ? rowClassName(row.original) : undefined}
                                >
                                    {row.getVisibleCells().map((cell, index) => {
                                        const isFirst = index === 0;
                                        const isLast = index === row.getVisibleCells().length - 1;
                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={cn(
                                                    "bg-white transition-colors duration-200",
                                                    isFirst ? "sticky left-0 z-20 border-r border-zinc-100/50 group-hover/row:bg-zinc-50/50" : "",
                                                    isLast ? "sticky right-0 z-20 border-l border-zinc-100/50 group-hover/row:bg-zinc-50/50" : ""
                                                )}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-1 flex items-center">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-zinc-500 font-medium px-2">
                        Pg {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
