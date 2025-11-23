import React, { ReactNode } from "react";

interface AuroraBackgroundProps {
    children: ReactNode;
    showRadialGradient?: boolean;
    className?: string;
}

export const AuroraBackground = ({
    className = "",
    children,
    showRadialGradient = true,
}: AuroraBackgroundProps) => {
    return (
        <div className={`aurora-background-container ${className}`}>
            <div className="aurora-background-wrapper">
                <div className={`aurora-effect ${showRadialGradient ? 'with-gradient' : ''}`}></div>
            </div>
            {children}
        </div>
    );
};