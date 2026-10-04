/**
 * QuantLab Unified API Package
 * 
 * Modular, clean-architecture API layer designed according to SOLID software development principles:
 * - Single Responsibility Principle (SRP): Discrete modules for Transport, Symbols, Signal Processing, Market, Forecast, Economics, Portfolio, Analysis.
 * - Open/Closed Principle (OCP): Easily extensible with custom API clients or alternative data providers.
 * - Interface Segregation Principle (ISP): Granular, strongly typed domain contracts.
 * - Dependency Inversion Principle (DIP): Services depend on abstract client interfaces rather than raw HTTP calls.
 */

// Domain Types
export * from "./types";

// HTTP Transport & Errors
export * from "./client";

// Ticker Symbol Resolution
export * from "./symbols";

// Pure Signal Processing & Math
export * from "./signalProcessing";

// Market Operations
export * from "./marketService";

// Quantitative Forecasting
export * from "./forecastService";

// Financial Analysis & Risk
export * from "./analysisService";

// Macro Economics & Logistics
export * from "./economicsService";

// Portfolio & Performance Attribution
export * from "./portfolioService";
