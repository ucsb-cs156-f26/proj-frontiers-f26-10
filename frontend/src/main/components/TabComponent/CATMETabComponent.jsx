import React from "react";
import { Button, Card } from "react-bootstrap";

export default function CATMETabComponent({ courseId, testIdPrefix }) {
  const downloadCatmeCsv = () => {
    window.open(`/api/csv/catme?courseId=${courseId}`, "_blank");
  };

  return (
    <div data-testid={`${testIdPrefix}-catme-tab-component`}>
      <Card className="mb-3">
        <Card.Header>CATME Roster</Card.Header>
        <Card.Body>
          <p>
            Download the course roster as a CSV file in the format CATME
            expects for importing students.
          </p>
          <Button
            onClick={downloadCatmeCsv}
            data-testid={`${testIdPrefix}-catme-download-csv-button`}
          >
            Download CSV Roster in CATME format
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}
