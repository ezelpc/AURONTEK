import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
    status?: 'available' | 'busy' | 'offline' | string;
}

export const StatusBadge = ({ status = 'offline' }: StatusBadgeProps) => {
    const { t } = useTranslation();

    let color = 'bg-slate-400';
    let labelKey = 'offline';

    if (status === 'available') {
        color = 'bg-green-500';
        labelKey = 'available';
    } else if (status === 'busy') {
        color = 'bg-red-500';
        labelKey = 'busy';
    }

    return (
        <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
            <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                {t(labelKey)}
            </span>
        </div>
    );
};
