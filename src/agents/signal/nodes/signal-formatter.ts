import { createPhantomButtons } from "../../../lib/phantom";
import { logger } from "../../../utils/logger";
import { safeParseNumber } from "../../../utils/number";
import type { SignalGraphState } from "../graph-state";

/**
 * Configuration for signal direction display
 */
const SIGNAL_CONFIG = {
  BUY: { emoji: "🚀" },
  SELL: { emoji: "🚨" },
  NEUTRAL: { emoji: "📊" },
} as const;

/**
 * Configuration for timeframe display
 */
const TIMEFRAME_CONFIG = {
  SHORT: { label: "Short-term", note: "1-4h re-check" },
  MEDIUM: { label: "Mid-term", note: "4-12h re-check" },
  LONG: { label: "Long-term", note: "12-24h re-check" },
} as const;

/**
 * Formats price with full precision for accurate display
 */
const formatPrice = (price: number): string => {
  // Return full precision as string to match exact format from example
  return price.toString();
};

/**
 * Technical indicator analyzer with beginner-friendly explanations
 */
class TechnicalIndicatorAnalyzer {
  private indicators: Array<{
    name: string;
    value: number;
    condition: string;
    priority: number;
  }> = [];

  constructor(private ta: SignalGraphState["technicalAnalysis"]) {
    if (ta) {
      this.analyzeAllIndicators();
    }
  }

  private analyzeAllIndicators(): void {
    this.analyzeRSI();
    this.analyzeBollingerBands();
    this.analyzeADX();
    this.analyzeVWAPDeviation();
    this.analyzeOBVZScore();
    this.analyzeATRPercent();
  }

  private analyzeRSI(): void {
    const rsi = safeParseNumber(this.ta?.rsi);
    if (rsi === null) return;

    let condition: string;
    let priority = 0;

    if (rsi >= 80) {
      condition = "extremely overbought conditions favor sellers";
      priority = 3;
    } else if (rsi >= 70) {
      condition = "overbought conditions favor sellers";
      priority = 2;
    } else if (rsi <= 20) {
      condition = "extremely oversold conditions favor buyers";
      priority = 3;
    } else if (rsi <= 30) {
      condition = "oversold conditions favor buyers";
      priority = 2;
    } else if (rsi >= 45 && rsi <= 55) {
      condition = "neutral momentum, no strong bias";
      priority = 0;
    } else {
      condition = rsi > 50 ? "slightly bullish momentum" : "slightly bearish momentum";
      priority = 1;
    }

    this.indicators.push({
      name: `RSI ${rsi.toFixed(0)}`,
      value: rsi,
      condition,
      priority,
    });
  }

  private analyzeBollingerBands(): void {
    const percentB = safeParseNumber(this.ta?.percent_b);
    if (percentB === null) return;

    let condition: string;
    let priority = 0;

    if (percentB >= 1.0) {
      condition = "price breaking above upper band (potential reversal)";
      priority = 2;
    } else if (percentB >= 0.8) {
      condition = "approaching overbought territory";
      priority = 1;
    } else if (percentB <= 0.0) {
      condition = "price touching lower band (potential support)";
      priority = 2;
    } else if (percentB <= 0.2) {
      condition = "approaching oversold territory";
      priority = 1;
    } else {
      condition = `price within normal trading range (${(percentB * 100).toFixed(0)}% of band)`;
      priority = 0;
    }

    this.indicators.push({
      name: `Bollinger %B ${(percentB * 100).toFixed(0)}%`,
      value: percentB,
      condition,
      priority,
    });
  }

  private analyzeADX(): void {
    const adx = safeParseNumber(this.ta?.adx);
    if (adx === null) return;

    let condition: string;
    let priority = 0;

    if (adx >= 50) {
      condition = "extremely strong trend - high conviction trade";
      priority = 3;
    } else if (adx >= 25) {
      condition = "strong trend developing";
      priority = 2;
    } else if (adx >= 15) {
      condition = "moderate trend strength building";
      priority = 1;
    } else {
      condition = "weak trend - range-bound market";
      priority = 0;
    }

    // Add direction if available and meaningful
    const direction = this.ta?.adx_direction;
    if (direction && direction !== "NEUTRAL" && adx >= 20) {
      condition += ` (${direction.toLowerCase()}ward)`;
    }

    this.indicators.push({
      name: `ADX ${adx.toFixed(0)}`,
      value: adx,
      condition,
      priority,
    });
  }

  private analyzeVWAPDeviation(): void {
    const vwapDev = safeParseNumber(this.ta?.vwap_deviation);
    if (vwapDev === null) return;

    const absDeviation = Math.abs(vwapDev);
    let condition: string;
    let priority = 0;

    if (absDeviation >= 10) {
      condition = `extreme ${vwapDev > 0 ? "premium" : "discount"} to volume-weighted average`;
      priority = 3;
    } else if (absDeviation >= 5) {
      condition = `significant ${vwapDev > 0 ? "premium" : "discount"} to VWAP`;
      priority = 2;
    } else if (absDeviation >= 2) {
      condition = `moderate ${vwapDev > 0 ? "premium" : "discount"} to fair value`;
      priority = 1;
    } else {
      condition = "trading near volume-weighted fair value";
      priority = 0;
    }

    this.indicators.push({
      name: `VWAP Dev ${vwapDev > 0 ? "+" : ""}${vwapDev.toFixed(1)}%`,
      value: absDeviation,
      condition,
      priority,
    });
  }

  private analyzeOBVZScore(): void {
    const obvZScore = safeParseNumber(this.ta?.obv_zscore);
    if (obvZScore === null) return;

    const absZScore = Math.abs(obvZScore);
    let condition: string;
    let priority = 0;

    if (absZScore >= 2.5) {
      condition = `extreme volume ${obvZScore > 0 ? "accumulation" : "distribution"} detected`;
      priority = 3;
    } else if (absZScore >= 1.5) {
      condition = `strong volume ${obvZScore > 0 ? "buying" : "selling"} pressure`;
      priority = 2;
    } else if (absZScore >= 0.5) {
      condition = `moderate volume ${obvZScore > 0 ? "inflow" : "outflow"}`;
      priority = 1;
    } else {
      condition = "balanced volume activity";
      priority = 0;
    }

    this.indicators.push({
      name: `Volume Flow ${obvZScore > 0 ? "+" : ""}${obvZScore.toFixed(1)}σ`,
      value: absZScore,
      condition,
      priority,
    });
  }

  private analyzeATRPercent(): void {
    const atrPercent = safeParseNumber(this.ta?.atr_percent);
    if (atrPercent === null) return;

    let condition: string;
    let priority = 0;

    if (atrPercent >= 8) {
      condition = "extremely high volatility - large price swings expected";
      priority = 2;
    } else if (atrPercent >= 5) {
      condition = "high volatility - increased risk and opportunity";
      priority = 1;
    } else if (atrPercent >= 3) {
      condition = "moderate volatility - normal price movement";
      priority = 0;
    } else {
      condition = "low volatility - range-bound price action";
      priority = 0;
    }

    this.indicators.push({
      name: `Volatility ${atrPercent.toFixed(1)}%`,
      value: atrPercent,
      condition,
      priority,
    });
  }

  /**
   * Returns the top 3 most relevant indicators formatted as simple bullets
   */
  getBulletPoints(): string[] {
    return this.indicators
      .sort((a, b) => b.priority - a.priority || b.value - a.value)
      .slice(0, 3)
      .map((indicator) => `${indicator.name} - ${indicator.condition}`);
  }
}

/**
 * Creates a simple signal response with modern formatting
 */
export const createSimpleSignalResponse = (state: SignalGraphState) => {
  const { signalDecision, tokenSymbol, tokenAddress, currentPrice } = state;

  if (!signalDecision) {
    return createNoSignalResponse(state);
  }

  const config = SIGNAL_CONFIG[signalDecision.direction as keyof typeof SIGNAL_CONFIG];
  const timeframe = TIMEFRAME_CONFIG[signalDecision.timeframe as keyof typeof TIMEFRAME_CONFIG];
  const riskLabel = signalDecision.riskLevel.charAt(0) + signalDecision.riskLevel.slice(1).toLowerCase();

  // Analyze technical indicators
  const analyzer = new TechnicalIndicatorAnalyzer(state.technicalAnalysis);
  const indicatorBullets = analyzer.getBulletPoints();

  // Build why section - format as simple bullet points
  const whySection =
    indicatorBullets.length > 0
      ? indicatorBullets
          .slice(0, 3)
          .map((bullet) => `• ${bullet}`)
          .join("\n")
      : signalDecision.keyFactors
          .slice(0, 3)
          .map((factor) => `• ${factor}`)
          .join("\n");

  // Generate suggested action based on direction
  const actionMap = {
    BUY: `Consider gradual buy entry. Re-check chart after ${timeframe.note}`,
    SELL: `Consider partial or full sell. Re-check chart after ${timeframe.note}`,
    NEUTRAL: `Hold current position. Re-check market after ${timeframe.note}`,
  };
  const suggestedAction = actionMap[signalDecision.direction as keyof typeof actionMap];

  // Build final message in the exact format from the example
  const message = `${config.emoji} ${signalDecision.direction} ${tokenSymbol.toLowerCase()} - ${riskLabel} Risk
Price: $${formatPrice(currentPrice)} Confidence: ${Math.round(signalDecision.confidence * 100)} %
Timeframe: ${timeframe.label} (${timeframe.note} recommended)

🗒️ Market Snapshot
${signalDecision.reasoning}

🔍 Why?
${whySection}

🎯 Suggested Action
${suggestedAction}

⚠️ DYOR - Always do your own research.`;

  // Determine level based on risk and confidence
  const level =
    signalDecision.riskLevel === "HIGH" || signalDecision.confidence >= 0.8
      ? 3
      : signalDecision.riskLevel === "MEDIUM" || signalDecision.confidence >= 0.6
        ? 2
        : 1;

  return {
    finalSignal: {
      level: level as 1 | 2 | 3,
      title: `${config.emoji} ${signalDecision.direction} ${tokenSymbol.toLowerCase()} - ${riskLabel} Risk`,
      message,
      priority: signalDecision.riskLevel as "LOW" | "MEDIUM" | "HIGH",
      tags: [tokenSymbol.toLowerCase(), signalDecision.direction.toLowerCase(), signalDecision.riskLevel.toLowerCase()],
      buttons: createPhantomButtons(tokenAddress, tokenSymbol),
    },
  };
};

/**
 * Creates a standardized "no signal" response
 */
export const createNoSignalResponse = (state: SignalGraphState) => {
  const { tokenSymbol, tokenAddress } = state;

  return {
    finalSignal: {
      level: 1 as const,
      title: `🔍 [WATCH] $${tokenSymbol.toUpperCase()}`,
      message: `🔍 **[WATCH] $${tokenSymbol.toUpperCase()}**
📊 Status: **Monitoring** | 🎯 Market: **Neutral Range** | ⚠️ Risk: **Low**
⏰ **Next Check**: Regular monitoring mode

📈 **Analysis Summary**
Current technical indicators are within normal parameters. No significant trend breakouts or momentum shifts detected at this time.

🎯 **Suggested Action**
Continue monitoring market conditions. No immediate action required.

⚠️ DYOR - Always do your own research.`,
      priority: "LOW" as const,
      tags: [tokenSymbol.toLowerCase(), "monitoring", "neutral"],
      buttons: createPhantomButtons(tokenAddress, tokenSymbol),
    },
  };
};

/**
 * Main signal formatting node with LLM fallback
 */
export const formatSignal = async (state: SignalGraphState) => {
  logger.info("Starting signal formatting", {
    tokenAddress: state.tokenAddress,
    hasAnalysis: !!state.signalDecision,
    hasStaticFilter: !!state.staticFilterResult,
    hasTechnicalAnalysis: !!state.technicalAnalysis,
  });

  // Early exit if no signal decision exists
  if (!state.signalDecision) {
    logger.info("No signal decision found, returning no signal response", {
      tokenAddress: state.tokenAddress,
    });
    return createNoSignalResponse(state);
  }

  // When no signal should be generated
  if (!state.signalDecision.shouldGenerateSignal) {
    logger.info("Signal decision indicates no signal should be generated", {
      tokenAddress: state.tokenAddress,
      shouldGenerateSignal: state.signalDecision?.shouldGenerateSignal,
    });
    return createNoSignalResponse(state);
  }

  // Use simple template formatting for consistency
  logger.info("Using simple template-based signal formatting", {
    tokenAddress: state.tokenAddress,
    signalType: state.signalDecision?.signalType,
  });

  return createSimpleSignalResponse(state);
};
