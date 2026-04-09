import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
}

export const Card: React.FC<CardProps> = ({ title, value, icon, trend, trendColor = 'text-green-600' }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trendColor}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-neutral-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-neutral-800 mt-1">{value}</h3>
      </div>
    </div>
  );
};
