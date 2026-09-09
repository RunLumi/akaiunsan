// Shared dayjs singleton (Phase 3: moment -> dayjs, aligning with the
// backend). Every file imports dayjs from here so the plugin set and locale
// are configured exactly once:
//  - utc/timezone: the notification timezone chain (utc -> tz -> tz) that
//    moment-timezone served, plus `.local()`.
//  - weekOfYear: Calendar's month matrix (`.week()` get AND set).
//  - localizedFormat: `format("lll")` in the booking lists — output matches
//    moment's en `lll` byte-for-byte.
// Verified against the moment baseline: plural units ("hours"), the
// "dates" get-alias, startOf("date") and isSame(x, "date") behave identically.
import dayjs from "dayjs";
import "dayjs/locale/en";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import weekOfYear from "dayjs/plugin/weekOfYear";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import duration from "dayjs/plugin/duration";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(localizedFormat);
// `dayjs(x, "DD/MM/YYYY HH:mm")` parses in the wizard time pickers
dayjs.extend(customParseFormat);
// FixPlan pick-address day comparisons
dayjs.extend(isSameOrAfter);
// HistoryDetail computes the booking duration in hours
dayjs.extend(duration);
// Calendar month-matrix boundaries (startOf/endOf isoWeek equivalents)
dayjs.extend(isoWeek);
dayjs.locale("en");

export default dayjs;
