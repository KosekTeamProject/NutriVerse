import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeTemplateLayout,
  templateAllowedDataKeys,
} from "./share-template";

test("template preset metadata and typography survive normalization", () => {
  const layout = normalizeTemplateLayout({
    presetKey: "HEALTH_PULSE",
    photoAsBackground: false,
    elements: [
      {
        id: "pulse-current",
        kind: "text",
        dataKey: "healthPulse.current",
        x: 25,
        y: 27,
        width: 50,
        height: 18,
        fontSize: 104,
        fontFamily: "JAKARTA",
        fontWeight: 900,
        color: "#d9ff68",
        align: "center",
      },
    ],
  });

  assert.equal(layout.presetKey, "HEALTH_PULSE");
  assert.equal(layout.elements[0]?.fontFamily, "JAKARTA");
  assert.equal(layout.elements[0]?.fontWeight, 900);
  assert.deepEqual(templateAllowedDataKeys(layout), ["healthPulse.current"]);
});

test("unsupported typography and preset values use safe fallbacks", () => {
  const layout = normalizeTemplateLayout({
    presetKey: "UNKNOWN",
    elements: [
      {
        kind: "text",
        dataKey: "user.name",
        fontFamily: "RemoteFont",
        fontWeight: 950,
      },
    ],
  });

  assert.equal(layout.presetKey, "CUSTOM");
  assert.equal(layout.elements[0]?.fontFamily, "JAKARTA");
  assert.equal(layout.elements[0]?.fontWeight, 800);
});
