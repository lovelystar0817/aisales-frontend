import React from 'react';
import type { StandingWithDetails, StandingConfiguration } from '~/types/standings';
import { StandingCard } from '~/components/StandingCard';

interface StandingsCardsSectionProps {
  mainStanding: StandingWithDetails | null;
  mainLabel: string;
  personalBest?: StandingWithDetails | null;
  personalBestLabel: string;
  configuration: StandingConfiguration | null;
  showNoStanding?: boolean;
}

/**
 * Current Session / Last Result & Personal Best
 */
export const StandingsCardsSection: React.FC<StandingsCardsSectionProps> = ({
  mainStanding,
  mainLabel,
  personalBest,
  personalBestLabel,
  configuration,
  showNoStanding = false,
}) => {
  if (!mainStanding && !personalBest && !showNoStanding) return null;

  return (
    <>
      {/* Desktop (≥ md) – horizontal cards */}
      <div className="hidden md:flex items-start mb-8 rounded-lg border border-gray-200 bg-white">
        <StandingCard
          standing={mainStanding}
          label={mainLabel}
          configuration={configuration ?? null}
          showNoStanding={showNoStanding}
        />

        {personalBest && (
          <>
            <div className="border-l border-gray-200" />
            <StandingCard
              standing={personalBest}
              label={personalBestLabel}
              configuration={configuration ?? null}
            />
          </>
        )}
      </div>

      {/* Mobile (< md) – vertical cards */}
      <div className="md:hidden space-y-4 mb-8">
        <StandingCard
          standing={mainStanding}
          label={mainLabel}
          configuration={configuration ?? null}
          showNoStanding={showNoStanding}
          badgeClassName="h-12 w-12"
        />
        {personalBest && (
          <StandingCard
            standing={personalBest}
            label={personalBestLabel}
            configuration={configuration ?? null}
            badgeClassName="h-12 w-12"
          />
        )}
      </div>
    </>
  );
};
