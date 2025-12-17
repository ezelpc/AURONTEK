import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface Tab {
    value: string;
    label: string;
    icon?: React.ReactNode;
    data: any[];
}

interface DataTableCardProps<T> {
    tabs?: Tab[];
    columns: Column<T>[];
    data?: T[];
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
}

export function DataTableCard<T extends { _id?: string; id?: string }>({
    tabs,
    columns,
    data,
    emptyMessage = 'No hay registros disponibles.',
    onRowClick
}: DataTableCardProps<T>) {
    const renderTable = (tableData: T[]) => (
        <Table>
            <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                    {columns.map((col, idx) => (
                        <TableHead
                            key={idx}
                            className={`text-slate-400 font-medium ${col.className || ''}`}
                        >
                            {col.header}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {tableData.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                        <TableCell
                            colSpan={columns.length}
                            className="text-center h-32 text-slate-500"
                        >
                            {emptyMessage}
                        </TableCell>
                    </TableRow>
                ) : (
                    tableData.map((item) => (
                        <TableRow
                            key={item._id || item.id}
                            className="border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors"
                            onClick={() => onRowClick?.(item)}
                        >
                            {columns.map((col, idx) => (
                                <TableCell key={idx} className={`text-slate-300 ${col.className || ''}`}>
                                    {typeof col.accessor === 'function'
                                        ? col.accessor(item)
                                        : String(item[col.accessor])}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    if (tabs) {
        return (
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                    <Tabs defaultValue={tabs[0]?.value} className="w-full">
                        <div className="border-b border-slate-800 px-4 bg-slate-900/50">
                            <TabsList className="bg-transparent border-b-0 h-12">
                                {tabs.map((tab) => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none"
                                    >
                                        {tab.icon && <span className="mr-2">{tab.icon}</span>}
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                        {tabs.map((tab) => (
                            <TabsContent key={tab.value} value={tab.value} className="p-0 m-0">
                                {renderTable(tab.data)}
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-0">
                {renderTable(data || [])}
            </CardContent>
        </Card>
    );
}
