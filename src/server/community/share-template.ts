import { ApiRequestError, stringValue } from "@/lib/api";

export const SHARE_TEMPLATE_DATA_FIELDS = [
  { key: "user.name", label: "Nama pengguna" },
  { key: "user.username", label: "Username" },
  { key: "user.avatar", label: "Foto profil" },
  { key: "moment.photo", label: "Foto momen" },
  { key: "moment.caption", label: "Caption" },
  { key: "activity.type", label: "Jenis aktivitas" },
  { key: "activity.date", label: "Tanggal aktivitas" },
  { key: "activity.distance", label: "Jarak aktivitas" },
  { key: "activity.duration", label: "Durasi aktivitas" },
  { key: "activity.calories", label: "Kalori aktivitas" },
  { key: "progress.streak", label: "Streak" },
  { key: "progress.rank", label: "Rank" },
  { key: "progress.xp", label: "XP" },
  { key: "healthPulse.current", label: "Health Pulse saat ini" },
  { key: "healthPulse.previous", label: "Health Pulse sebelumnya" },
  { key: "healthPulse.delta", label: "Perubahan Health Pulse" },
  { key: "healthPulse.trend", label: "Arah perubahan Health Pulse" },
] as const;

const fieldKeys = new Set<string>(SHARE_TEMPLATE_DATA_FIELDS.map((field) => field.key));

export type ShareTemplateElement = {
  id: string;
  kind: "text" | "image";
  dataKey?: string;
  staticText?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: "INTER" | "JAKARTA" | "ARIAL" | "GEORGIA";
  fontWeight?: 400 | 500 | 600 | 700 | 800 | 900;
  color?: string;
  align?: "left" | "center" | "right";
  required?: boolean;
  userCanHide?: boolean;
};

function percentage(value: unknown, label: string, fallback: number) {
  const number = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  if (number < 0 || number > 100) throw new ApiRequestError(`${label} harus berada pada rentang 0-100.`);
  return Math.round(number * 100) / 100;
}

export function normalizeTemplateLayout(value: unknown) {
  const input = value && typeof value === "object" ? value as { elements?: unknown; photoAsBackground?: unknown; presetKey?: unknown } : {};
  if (!Array.isArray(input.elements)) throw new ApiRequestError("Layout template harus memiliki daftar elemen.");
  if (input.elements.length > 40) throw new ApiRequestError("Maksimal 40 elemen dalam satu template.");
  const elements: ShareTemplateElement[] = input.elements.map((raw, index) => {
    const element = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const kind = element.kind === "image" ? "image" : "text";
    const dataKey = typeof element.dataKey === "string" && fieldKeys.has(element.dataKey) ? element.dataKey : undefined;
    const staticText = typeof element.staticText === "string" && element.staticText.trim()
      ? stringValue(element.staticText, `Teks elemen ${index + 1}`, { max: 160 })
      : undefined;
    if (!dataKey && !staticText) throw new ApiRequestError(`Elemen ${index + 1} harus memiliki sumber data atau teks statis.`);
    const color = typeof element.color === "string" && /^#[0-9a-f]{6}$/i.test(element.color) ? element.color : "#ffffff";
    const fontFamily = ["INTER", "JAKARTA", "ARIAL", "GEORGIA"].includes(
      String(element.fontFamily),
    )
      ? (element.fontFamily as ShareTemplateElement["fontFamily"])
      : "JAKARTA";
    const numericFontWeight = Number(element.fontWeight);
    const fontWeight = [400, 500, 600, 700, 800, 900].includes(
      numericFontWeight,
    )
      ? (numericFontWeight as ShareTemplateElement["fontWeight"])
      : 800;
    return {
      id: typeof element.id === "string" && element.id.trim() ? element.id.slice(0, 80) : `element-${index + 1}`,
      kind,
      dataKey,
      staticText,
      x: percentage(element.x, "Posisi X", 5),
      y: percentage(element.y, "Posisi Y", 5 + index * 10),
      width: percentage(element.width, "Lebar", 40),
      height: percentage(element.height, "Tinggi", 10),
      fontSize: Math.min(Math.max(typeof element.fontSize === "number" ? element.fontSize : 32, 8), 160),
      fontFamily,
      fontWeight,
      color,
      align: element.align === "center" || element.align === "right" ? element.align : "left",
      required: element.required === true,
      userCanHide: element.userCanHide !== false,
    };
  });
  const presetKey = ["HEALTH_PULSE", "ACTIVITY", "PROGRESS", "CUSTOM"].includes(
    String(input.presetKey),
  )
    ? String(input.presetKey)
    : "CUSTOM";
  return { elements, photoAsBackground: input.photoAsBackground === true, presetKey };
}

export function templateAllowedDataKeys(layout: ReturnType<typeof normalizeTemplateLayout>) {
  return [...new Set(layout.elements.map((element) => element.dataKey).filter((key): key is string => Boolean(key)))];
}
