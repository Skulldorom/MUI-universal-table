// This file is used to configure Jest for testing React components
/* eslint-disable no-console */
import { afterEach, beforeEach, jest } from "@jest/globals";
import "@testing-library/jest-dom";

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation((...args) => {
    originalConsoleError(...args);
    throw new Error(`Unexpected console.error during test: ${args.join(" ")}`);
  });

  jest.spyOn(console, "warn").mockImplementation((...args) => {
    originalConsoleWarn(...args);
    throw new Error(`Unexpected console.warn during test: ${args.join(" ")}`);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
