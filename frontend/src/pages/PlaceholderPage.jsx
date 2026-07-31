import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const PlaceholderPage = ({
  title,
  subtitle,
  iconName = 'ShieldAlert',
  badgeText = 'ROUTE PLACEHOLDER',
  description = 'This application page module route is configured as part of Phase 1 Frontend Foundation.',
}) => {
  const IconComponent = Icons[iconName] ? Icons[iconName] : Icons.Shield;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        badgeText={badgeText}
        badgeVariant="primary"
        actions={
          <Button variant="outline" size="sm" leftIcon={Icons.RefreshCw}>
            Refresh Module
          </Button>
        }
      />

      <Card className="p-8 text-center border-dashed border-gray-800 bg-[#0D1322]/60">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto py-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4 glow-blue">
            <IconComponent className="w-8 h-8 text-blue-400" />
          </div>

          <Badge variant="info" size="md" className="mb-3 font-mono">
            PHASE 1 ARCHITECTURE READY
          </Badge>

          <h3 className="text-xl font-bold text-gray-100 font-heading mb-2">
            {title} Module Placeholder
          </h3>

          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            {description}
          </p>

          <div className="flex items-center gap-3 text-xs font-mono text-gray-500 bg-gray-900/80 px-4 py-2 rounded-lg border border-gray-800">
            <span>Route:</span>
            <span className="text-cyan-400 font-bold">
              {window.location.pathname}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
