import { MSIG_SECTIONS } from '../msig/MSIGSalesTechnique';

/**
 * Prefer a live polled value if present; otherwise, if feedback exists, parse and return
 * the stored JSON value. Returns null when neither source has data.
 *
 * @template T
 * @param polledValue The most recent value from polling, if any
 * @param hasFeedback Whether the feedback JSON is available to parse
 * @param feedbackJson The raw JSON string from feedback storage
 * @param emptyFallback JSON used when feedbackJson is undefined (defaults to '{}')
 * @returns The selected value or null
 */
export function preferPolledOrFeedback<T>(
  polledValue: T | undefined | null,
  hasFeedback: boolean,
  feedbackJson: string | undefined | null,
  emptyFallback: string = '{}',
): T | null {
  if (polledValue) return polledValue;
  if (!hasFeedback) return null;
  return JSON.parse(feedbackJson ?? emptyFallback) as T;
}

/**
 * Compute the refetch interval for sales techniques polling based on assessment type
 * and current server state. Returns a delay in ms to continue polling, or false to stop.
 *
 * - MSIG: keep polling while generating or sections incomplete
 * - Prudential: stop after techniques present and standing is done
 * - Regular: stop once techniques are present
 *
 * @param query TanStack Query context containing state and data
 * @param isMSIG Whether the assessment type is MSIG
 * @param isPrudential Whether the assessment type is Prudential
 * @returns Milliseconds to wait before next poll, or false to stop polling
 */
export function getSalesTechniquesRefetchInterval(
  query: any,
  isMSIG: boolean,
  isPrudential: boolean,
): number | false {
  const stopCondition = (data: any): boolean => {
    if (isMSIG) {
      return shouldStopMsigPolling(data);
    }

    if (isPrudential) {
      return Boolean(
        data?.salesTechniques && data?.isStandingGenerating === false,
      );
    }

    // Regular: stop once techniques are present
    return Boolean(data?.salesTechniques);
  };

  return finitePollingRefetchInterval(query, stopCondition);
}

/**
 * Generic finite polling helper that stops when the provided stop condition is met,
 * when the server indicates content is too brief, on error, or after a safety cap.
 *
 * @param query TanStack Query context containing state and data
 * @param stopCondition Predicate that returns true when polling should stop
 * @returns Milliseconds to wait before next poll, or false to stop polling
 */
export function finitePollingRefetchInterval(
  query: any,
  stopCondition: (data: any) => boolean,
): number | false {
  const data = query.state.data;
  if (query.state.error) return false;
  // Keep polling while backend explicitly says it's still generating,
  // even if the stop condition is already met (data may be intermediate)
  if (data?.generating === true) return 3000;
  if (stopCondition(data)) return false;
  if (data?.tooBrief) return false;
  const pollCount = query.state.fetchFailureCount + query.state.dataUpdateCount;
  if (pollCount > 40) return false;
  return 3000;
}

function hasIncompleteMsigSections(sections: any): boolean {
  return MSIG_SECTIONS.some((sectionType) => {
    const section = sections?.[sectionType];
    return (
      !section ||
      section.isGenerating === true ||
      !section.evaluations ||
      section.evaluations.length === 0
    );
  });
}

function shouldStopMsigPolling(data: any): boolean {
  // Continue polling if there is no techniques payload yet
  if (!data?.salesTechniques) return false;

  // If still generating, keep polling
  if (data?.generating === true) return false;

  const sections = data?.salesTechniques?.sections;

  // If sections exist and any are incomplete, keep polling
  if (sections && hasIncompleteMsigSections(sections)) return false;

  // Stop only when server indicates generation is done
  return data?.generating === false;
}


