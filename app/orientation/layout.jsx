import IntegratedSectionShell from "../../components/layout/IntegratedSectionShell";

// Every orientation subpage shares the same header, language controls,
// light/dark theme and mobile navigation as lessons and calculator.
export default function OrientationLayout({ children }) {
  return <IntegratedSectionShell section="orientation">{children}</IntegratedSectionShell>;
}
