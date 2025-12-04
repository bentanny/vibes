"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export interface StockQuote {
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

interface FinnhubTrade {
  p: number; // price
  s: string; // symbol
  t: number; // timestamp
  v: number; // volume
}

interface FinnhubMessage {
  type: string;
  data?: FinnhubTrade[];
}

const FINNHUB_WS_URL = "wss://ws.finnhub.io";

/**
 * Custom hook for real-time stock prices via Finnhub WebSocket
 * @param symbol - Stock ticker symbol (e.g., "TSLA", "AAPL")
 * @returns StockQuote object with price, change, and connection status
 */
export function useStockPrice(symbol: string): StockQuote {
  const [quote, setQuote] = useState<StockQuote>({
    price: null,
    previousClose: null,
    change: null,
    changePercent: null,
    isLoading: true,
    error: null,
    isConnected: false,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousCloseRef = useRef<number | null>(null);
  const wsFailedRef = useRef<boolean>(false);

  // Fetch previous close for calculating change
  const fetchPreviousClose = useCallback(async (sym: string) => {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!apiKey) return;

    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${apiKey}`
      );
      const data = await response.json();
      if (data.pc) {
        previousCloseRef.current = data.pc;
        setQuote((prev) => ({
          ...prev,
          previousClose: data.pc,
          // If we already have a price, calculate change
          ...(prev.price && {
            change: prev.price - data.pc,
            changePercent: ((prev.price - data.pc) / data.pc) * 100,
          }),
        }));
      }
      // Also set initial price from REST if available
      if (data.c) {
        console.log(`[useStockPrice] ✅ Got price for ${sym}: $${data.c} (${((data.c - data.pc) / data.pc * 100).toFixed(2)}%)`);
        setQuote((prev) => ({
          ...prev,
          price: data.c,
          previousClose: data.pc,
          change: data.c - data.pc,
          changePercent: ((data.c - data.pc) / data.pc) * 100,
          isLoading: false,
        }));
      } else {
        console.warn(`[useStockPrice] ⚠️ No price data returned for ${sym}:`, data);
      }
    } catch (err) {
      console.error("[useStockPrice] ❌ Failed to fetch quote:", err);
    }
  }, []);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

    console.log(`[useStockPrice] Initializing for symbol: ${symbol}`);
    console.log(`[useStockPrice] API Key configured: ${apiKey ? "Yes" : "NO - Add NEXT_PUBLIC_FINNHUB_API_KEY to .env.local"}`);

    if (!apiKey) {
      console.error("[useStockPrice] ❌ Missing NEXT_PUBLIC_FINNHUB_API_KEY in .env.local");
      setQuote((prev) => ({
        ...prev,
        isLoading: false,
        error: "NEXT_PUBLIC_FINNHUB_API_KEY not configured",
      }));
      return;
    }

    if (!symbol) {
      setQuote((prev) => ({
        ...prev,
        isLoading: false,
        error: "No symbol provided",
      }));
      return;
    }

    const upperSymbol = symbol.toUpperCase();

    // Fetch initial data via REST API
    fetchPreviousClose(upperSymbol);

    const connect = () => {
      try {
        const socket = new WebSocket(`${FINNHUB_WS_URL}?token=${apiKey}`);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log(`[Finnhub] Connected, subscribing to ${upperSymbol}`);
          socket.send(JSON.stringify({ type: "subscribe", symbol: upperSymbol }));
          setQuote((prev) => ({ ...prev, isConnected: true, error: null }));
        };

        socket.onmessage = (event) => {
          try {
            const message: FinnhubMessage = JSON.parse(event.data);

            if (message.type === "trade" && message.data && message.data.length > 0) {
              // Get the latest trade for our symbol
              const latestTrade = message.data
                .filter((trade) => trade.s === upperSymbol)
                .sort((a, b) => b.t - a.t)[0];

              if (latestTrade) {
                const newPrice = latestTrade.p;
                const prevClose = previousCloseRef.current;

                setQuote((prev) => ({
                  ...prev,
                  price: newPrice,
                  isLoading: false,
                  ...(prevClose && {
                    change: newPrice - prevClose,
                    changePercent: ((newPrice - prevClose) / prevClose) * 100,
                  }),
                }));
              }
            }
          } catch (err) {
            console.error("[Finnhub] Failed to parse message:", err);
          }
        };

        socket.onerror = () => {
          // WebSocket errors are often due to network issues or invalid tokens
          // Don't overwrite price data - REST API fallback still works
          console.warn("[Finnhub] ⚠️ WebSocket error - falling back to REST API polling");
          wsFailedRef.current = true;
          setQuote((prev) => ({
            ...prev,
            isConnected: false,
          }));
          
          // Start polling fallback if not already polling
          if (!pollingIntervalRef.current) {
            console.log("[Finnhub] 🔄 Starting REST API polling (every 15s)");
            pollingIntervalRef.current = setInterval(() => {
              fetchPreviousClose(upperSymbol);
            }, 15000); // Poll every 15 seconds (free tier friendly)
          }
        };

        socket.onclose = (event) => {
          const closeReasons: Record<number, string> = {
            1000: "Normal closure",
            1001: "Going away",
            1002: "Protocol error",
            1003: "Unsupported data",
            1006: "Abnormal closure (network issue)",
            1008: "Policy violation",
            1011: "Server error",
            4000: "Invalid API key",
            4001: "Rate limit exceeded",
          };
          console.log(`[Finnhub] Disconnected: ${closeReasons[event.code] || `Code ${event.code}`}`);
          setQuote((prev) => ({ ...prev, isConnected: false }));

          // Reconnect after 5 seconds if not intentionally closed
          if (event.code !== 1000) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log("[Finnhub] Attempting reconnect...");
              connect();
            }, 5000);
          }
        };
      } catch (err) {
        console.error("[Finnhub] Failed to connect:", err);
        setQuote((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to establish WebSocket connection",
        }));
      }
    };

    connect();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (socketRef.current) {
        // Unsubscribe before closing
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({ type: "unsubscribe", symbol: upperSymbol })
          );
        }
        socketRef.current.close(1000, "Component unmounted");
      }
    };
  }, [symbol, fetchPreviousClose]);

  return quote;
}

/**
 * Hook for multiple stock symbols
 */
export function useMultipleStockPrices(
  symbols: string[]
): Record<string, StockQuote> {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const previousClosesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

    if (!apiKey || symbols.length === 0) return;

    const upperSymbols = symbols.map((s) => s.toUpperCase());

    // Initialize quotes
    const initialQuotes: Record<string, StockQuote> = {};
    upperSymbols.forEach((sym) => {
      initialQuotes[sym] = {
        price: null,
        previousClose: null,
        change: null,
        changePercent: null,
        isLoading: true,
        error: null,
        isConnected: false,
      };
    });
    setQuotes(initialQuotes);

    // Fetch previous closes for all symbols
    const fetchAllPreviousCloses = async () => {
      await Promise.all(
        upperSymbols.map(async (sym) => {
          try {
            const response = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${apiKey}`
            );
            const data = await response.json();
            if (data.pc) {
              previousClosesRef.current[sym] = data.pc;
              setQuotes((prev) => ({
                ...prev,
                [sym]: {
                  ...prev[sym],
                  previousClose: data.pc,
                  price: data.c || prev[sym]?.price,
                  change: data.c ? data.c - data.pc : null,
                  changePercent: data.c
                    ? ((data.c - data.pc) / data.pc) * 100
                    : null,
                  isLoading: false,
                },
              }));
            }
          } catch (err) {
            console.error(`Failed to fetch quote for ${sym}:`, err);
          }
        })
      );
    };

    fetchAllPreviousCloses();

    // Connect WebSocket
    const socket = new WebSocket(`${FINNHUB_WS_URL}?token=${apiKey}`);
    socketRef.current = socket;

    socket.onopen = () => {
      upperSymbols.forEach((sym) => {
        socket.send(JSON.stringify({ type: "subscribe", symbol: sym }));
      });
      setQuotes((prev) => {
        const updated = { ...prev };
        upperSymbols.forEach((sym) => {
          if (updated[sym]) {
            updated[sym] = { ...updated[sym], isConnected: true };
          }
        });
        return updated;
      });
    };

    socket.onmessage = (event) => {
      try {
        const message: FinnhubMessage = JSON.parse(event.data);
        if (message.type === "trade" && message.data) {
          const updates: Record<string, number> = {};

          message.data.forEach((trade) => {
            if (upperSymbols.includes(trade.s)) {
              updates[trade.s] = trade.p;
            }
          });

          if (Object.keys(updates).length > 0) {
            setQuotes((prev) => {
              const updated = { ...prev };
              Object.entries(updates).forEach(([sym, price]) => {
                const prevClose = previousClosesRef.current[sym];
                updated[sym] = {
                  ...updated[sym],
                  price,
                  isLoading: false,
                  ...(prevClose && {
                    change: price - prevClose,
                    changePercent: ((price - prevClose) / prevClose) * 100,
                  }),
                };
              });
              return updated;
            });
          }
        }
      } catch (err) {
        console.error("[Finnhub] Parse error:", err);
      }
    };

    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        upperSymbols.forEach((sym) => {
          socketRef.current?.send(
            JSON.stringify({ type: "unsubscribe", symbol: sym })
          );
        });
        socketRef.current.close(1000);
      }
    };
  }, [symbols.join(",")]);

  return quotes;
}

