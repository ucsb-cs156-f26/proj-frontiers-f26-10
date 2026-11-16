import React from "react";
import CATMEAuditCard from "main/components/CATME/CATMEAuditCard";

export default function CATMETabComponent({ testIdPrefix, courseId }) {
  return (
    <div data-testid={`${testIdPrefix}-catme-tab-component`}>
      <CATMEAuditCard courseId={courseId} />
    </div>
  );
}
