import test from "node:test";
import assert from "node:assert/strict";

import {
  formatPower,
  formatWindMph,
  solarProgress,
  windToMph,
} from "../custom_components/energy_command_centre/frontend/overview/formatters.js";

test("formatPower changes from watts to kilowatts at 1,000 W", () => {
  assert.equal(formatPower(742), "742 W");
  assert.equal(formatPower(3280), "3.28 kW");
  assert.equal(formatPower(null), "Unavailable");
});

test("wind is consistently converted to mph", () => {
  assert.equal(formatWindMph(16.0934, "km/h"), "10.0 mph");
  assert.equal(formatWindMph(10, "m/s"), "22.4 mph");
  assert.equal(windToMph(10, "kn"), 11.5078);
});

test("day progress uses the current sunrise and sunset", () => {
  const environment = {
    sun: {
      state: "above_horizon",
      previous_rising: "2026-09-16T06:00:00+00:00",
      next_setting: "2026-09-16T18:00:00+00:00",
    },
  };
  assert.deepEqual(
    solarProgress(environment, new Date("2026-09-16T12:00:00Z")),
    { mode: "day", progress: 0.5, remainingMs: 21600000 },
  );
});

test("night progress uses sunset and the next sunrise", () => {
  const environment = {
    sun: {
      state: "below_horizon",
      previous_setting: "2026-09-16T18:00:00+00:00",
      next_rising: "2026-09-17T06:00:00+00:00",
    },
  };
  assert.deepEqual(
    solarProgress(environment, new Date("2026-09-17T00:00:00Z")),
    { mode: "night", progress: 0.5, remainingMs: 21600000 },
  );
});
