import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-[var(--card-bg)] rounded-2xl shadow-md ${className} text-[var(--card-fg)] border border-[var(--border-color)]`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }) {
  return <div className={`border-b border-[var(--border-color)] p-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = "" }) {
  return <p className={`text-sm text-[var(--card-fg)]/70 ${className}`}>{children}</p>;
}
