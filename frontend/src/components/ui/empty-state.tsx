import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
}

export const EmptyState = ({
    icon: Icon,
    title,
    description,
    action
}: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <Icon className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md">{description}</p>
            {action}
        </div>
    );
};
