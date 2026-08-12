import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '~/context/language';
import type {
  ClientPortfolio as ClientPortfolioData,
  AssetGroup,
} from '~/routes/app/roleplay/types';
import { cn } from '~/util/utils';

interface ClientPortfolioProps {
  readonly clientPortfolio: ClientPortfolioData;
}

export function ClientPortfolio({ clientPortfolio }: ClientPortfolioProps) {
  const { t } = useTranslation();
  const { language: _lang } = useLanguage();
  const language = ['en', 'th'].includes(_lang) ? (_lang as 'en' | 'th') : 'en';

  const { currentPortfolio, adjustedPortfolios } = clientPortfolio;

  const [expandedCase, setExpandedCase] = useState<number | null>(null);
  const [showPerformance, setShowPerformance] = useState(false);

  const toggleCase = (caseIndex: number) => {
    setExpandedCase(expandedCase === caseIndex ? null : caseIndex);
  };

  return (
    <div className="p-4 text-sm text-gray-900">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-1">
          Total Asset
        </h4>
        <code className="text-base">
          THB {currentPortfolio.totalValueTHB.toLocaleString('th-TH')}
        </code>
      </div>

      {/* CURRENT PORTFOLIO - No adjustments */}
      <div className="mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="px-0.5 py-0.5 text-sm text-left" colSpan={2}>
                Asset Allocation
              </th>
              <th></th>
              <th></th>
              <th
                className="px-0.5 py-0.5 text-xs text-right lining-nums"
                title="1-Year Return"
              >
                1Y RET
              </th>
              <th
                className="px-0.5 py-0.5 text-xs text-right lining-nums"
                title="1-Year Volatility"
              >
                1Y VOL
              </th>
            </tr>
          </thead>
          <tbody>
            {currentPortfolio.holdings.map((holding) => {
              const performance = ASSET_PERFORMANCE[holding.assetGroup];
              return (
                <tr key={holding.assetGroup}>
                  <td className="w-4 p-0 align-middle">
                    <div
                      className="w-2 h-2 rounded-full mx-auto"
                      style={{
                        backgroundColor: ASSET_COLORS[holding.assetGroup],
                      }}
                    />
                  </td>
                  <td className="px-2 py-0.5 text-gray-700 align-middle truncate max-w-[150px]">
                    <span className="text-[13px]">
                      {ASSET_NAMES[holding.assetGroup][language]}
                    </span>
                  </td>
                  <td className="px-2 py-0.5 text-gray-600 font-semibold text-right align-middle whitespace-nowrap">
                    <code className="text-[11px]">
                      {holding.weightPercent}%
                    </code>
                  </td>
                  <td className="px-2 py-0.5 text-gray-600 text-right align-middle whitespace-nowrap">
                    <code className="text-[11px]">
                      {formatTHB(holding.amountTHB)}
                    </code>
                  </td>
                  <td className="text-right align-middle px-0.5 py-0.5">
                    <div>
                      <PerformanceBadge
                        label="Return"
                        value={performance.return}
                        isReturn
                      />
                    </div>
                  </td>
                  <td className="text-right align-middle px-0.5 py-0.5">
                    <div>
                      <PerformanceBadge
                        label="Vol"
                        value={performance.volatility}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Performance section for current portfolio */}
        {showPerformance && (
          <div className="mt-3 space-y-1.5 pl-6">
            {currentPortfolio.holdings.map((holding) => {
              const performance = ASSET_PERFORMANCE[holding.assetGroup];
              return (
                <div
                  key={`perf-${holding.assetGroup}`}
                  className="flex items-center gap-2 w-full"
                >
                  <div className="text-xs text-gray-600 w-32 truncate mr-auto">
                    {ASSET_NAMES[holding.assetGroup][language]}
                  </div>
                  <PerformanceBadge
                    label="Return"
                    value={performance.return}
                    isReturn
                  />
                  <PerformanceBadge
                    label="Vol"
                    value={performance.volatility}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADJUSTED PORTFOLIOS - With adjustments */}
      {adjustedPortfolios && (
        <div className="space-y-2">
          {adjustedPortfolios.map((portfolio, index) => {
            let caseTitle = 'Rebalance w/o Topup';
            if (portfolio.totalAdjustmentTHB > 0) {
              caseTitle = 'Rebalance with Topup';
            }

            return (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  className="group flex w-full items-center justify-between px-3 py-2 text-left focus:outline-none hover:bg-gray-50"
                  onClick={() => toggleCase(index)}
                  type="button"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-700">
                      Case {index + 1}: {caseTitle}
                    </span>
                    {portfolio.totalAdjustmentTHB !== 0 && (
                      <span className="text-xs text-gray-500">
                        ({formatAdjustment(portfolio.totalAdjustmentTHB)} →{' '}
                        {formatTHB(portfolio.totalValueTHB)})
                      </span>
                    )}
                  </div>
                  <ChevronDownIcon
                    className={`size-4 text-gray-500 transition-transform ${
                      expandedCase === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedCase === index && (
                  <div className="border-t border-gray-200 px-3 py-2 bg-gray-50/50">
                    <div className="mb-3 space-y-1">
                      {portfolio.totalAdjustmentTHB > 0 ? (
                        <div className="text-xs font-semibold text-green-700">
                          Top-up: +THB {formatTHB(portfolio.totalAdjustmentTHB)}
                        </div>
                      ) : portfolio.totalAdjustmentTHB < 0 ? (
                        <div className="text-xs font-semibold text-red-700">
                          Withdrawal: THB{' '}
                          {formatTHB(Math.abs(portfolio.totalAdjustmentTHB))}
                        </div>
                      ) : null}
                      <div className="text-sm font-medium text-gray-700">
                        New Total: THB {formatTHB(portfolio.totalValueTHB)}
                      </div>
                    </div>

                    {/* Adjusted portfolio table WITH adjustment indicators */}
                    <table className="w-full text-sm">
                      <tbody>
                        {portfolio.holdings.map((holding) => (
                          <tr
                            key={holding.assetGroup}
                            className={cn(
                              holding.adjustmentTHB !== 0 && 'bg-blue-50/50',
                            )}
                          >
                            <td className="w-3 p-0 align-middle">
                              <div
                                className="w-1.5 h-1.5 rounded-full mx-auto"
                                style={{
                                  backgroundColor:
                                    ASSET_COLORS[holding.assetGroup],
                                }}
                              />
                            </td>
                            <td className="px-2 text-gray-700 align-middle truncate max-w-[120px]">
                              {ASSET_NAMES[holding.assetGroup][language]}
                            </td>

                            {/* Show adjustment amount if it exists and is non-zero */}
                            {holding.adjustmentTHB !== undefined &&
                              holding.adjustmentTHB !== 0 && (
                                <td
                                  className={cn(
                                    'px-2 text-xs font-medium text-right align-middle whitespace-nowrap',
                                    holding.adjustmentTHB > 0 &&
                                      'text-green-700',
                                    holding.adjustmentTHB < 0 && 'text-red-600',
                                  )}
                                >
                                  {holding.adjustmentTHB > 0 ? '+' : ''}
                                  {formatTHB(holding.adjustmentTHB)}
                                </td>
                              )}
                            {(holding.adjustmentTHB === undefined ||
                              holding.adjustmentTHB === 0) && (
                              <td className="px-2 text-xs text-gray-400 text-right align-middle">
                                —
                              </td>
                            )}

                            <td className="px-2 font-medium text-gray-600 text-right align-middle whitespace-nowrap">
                              {holding.weightPercent}%
                            </td>
                            <td className="pl-2 text-gray-600 text-right align-middle whitespace-nowrap">
                              {formatTHB(holding.amountTHB)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface PerformanceBadgeProps {
  label: string;
  value: number;
  isReturn?: boolean;
}

function PerformanceBadge({
  label,
  value,
  isReturn = false,
}: PerformanceBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
        isReturn && isPositive && 'bg-green-50 text-green-700',
        isReturn && isNegative && 'bg-red-50 text-red-600',
        !isReturn && 'bg-gray-100 text-gray-600',
      )}
    >
      <code className="font-medium text-[11px]">
        {value > 0 && isReturn ? '+' : ''}
        {value.toFixed(1)}%
      </code>
    </div>
  );
}

const ASSET_COLORS: Record<AssetGroup, string> = {
  'thai-fixed-income': '#3B82F6',
  'global-fixed-income': '#60A5FA',
  allocation: '#8B5CF6',
  'thai-equity': '#EF4444',
  'dm-equity': '#F59E0B',
  'em-equity': '#F97316',
  thematic: '#EC4899',
  'real-asset': '#10B981',
  commodities: '#FBBF24',
};

const ASSET_NAMES: Record<AssetGroup, { en: string; th: string }> = {
  'thai-fixed-income': { en: 'Thai Fixed Income', th: 'ตราสารหนี้ไทย' },
  'global-fixed-income': {
    en: 'Global Fixed Income',
    th: 'ตราสารหนี้ต่างประเทศ',
  },
  allocation: { en: 'Allocation', th: 'กองทุนผสม' },
  'thai-equity': { en: 'Thai Equity', th: 'กองทุนหุ้นไทย' },
  'dm-equity': { en: 'DM Equity', th: 'กองทุนหุ้นตลาดพัฒนาแล้ว' },
  'em-equity': { en: 'EM Equity', th: 'กองทุนหุ้นตลาดเกิดใหม่' },
  thematic: { en: 'Thematic', th: 'กองทุนหุ้นธีมเฉพาะทาง' },
  'real-asset': { en: 'Global Real Asset', th: 'กองทุนอสังหาฯ' },
  commodities: { en: 'Commodities', th: 'กองทุนสินค้าโภคภัณฑ์' },
};

// Hardcoded performance data from the spreadsheet
const ASSET_PERFORMANCE: Record<
  AssetGroup,
  { return: number; volatility: number }
> = {
  'thai-fixed-income': { return: 2.8, volatility: 2.8 },
  'global-fixed-income': { return: -1.4, volatility: 5.5 },
  allocation: { return: 3.9, volatility: 7.8 },
  'thai-equity': { return: -4.6, volatility: 15.0 },
  'dm-equity': { return: 8.7, volatility: 13.2 },
  'em-equity': { return: -2.3, volatility: 18.6 },
  thematic: { return: -6.1, volatility: 22.0 },
  'real-asset': { return: -3.5, volatility: 12.4 },
  commodities: { return: -8.9, volatility: 25.0 },
};

const formatTHB = (amount: number): string => {
  if (Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    const precise = millions.toFixed(2);
    // Show 2 decimals when needed (e.g. 2.75M), otherwise 1 (e.g. 2.8M)
    const display = precise.endsWith('0') ? millions.toFixed(1) : precise;
    return `${display}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return amount.toLocaleString('en-US');
};

const formatAdjustment = (amount: number): string => {
  if (amount > 0) return `+${formatTHB(amount)}`;
  if (amount < 0) return `-${formatTHB(Math.abs(amount))}`;
  return 'No change';
};
