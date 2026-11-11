import React, { useState } from "react";
import axios from "axios";
import { Alert, Button, Card, Form, Spinner } from "react-bootstrap";
import CATMEAuditResults from "./CATMEAuditResults";

export default function CATMEAuditCard({ courseId }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0] || null);
    setResult(null);
    setError("");
  };

  const handleAudit = async (event) => {
    event.preventDefault();

    if (!file || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/catme/audit", formData, {
        params: { courseId },
      });
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to audit the CSV file. Please check the file format and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card data-testid="catme-audit-card">
      <Card.Body>
        <Card.Title>Audit CATME Teammaker CSV Download</Card.Title>

        <Card.Text>
          When using CATME Teammaker, this option will allow you to ensure that
          the roster of students in CATME is up-to-date with the course roster
          in Frontiers. It treats Frontiers as the &quot;source of truth&quot;
          and lets you know what students need to be added to CATME, removed
          from CATME, or have their information in CATME (name, section)
          updated.
        </Card.Text>

        <p>To use it:</p>
        <ol>
          <li>
            Navigate to the page <code>/faculty/tm_display_results</code> in
            CATME and click the <strong>Export to CSV</strong> button.
          </li>
          <li>Upload that file here.</li>
          <li>Read the results.</li>
        </ol>

        <Form onSubmit={handleAudit}>
          <Form.Group className="mb-3">
            <Form.Label>CATME Teammaker CSV File</Form.Label>
            <Form.Control
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              data-testid="catme-audit-file"
            />
          </Form.Group>

          <Button
            type="submit"
            disabled={!file || loading}
            data-testid="catme-audit-submit"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Auditing...
              </>
            ) : (
              "Audit CSV"
            )}
          </Button>
        </Form>

        {error && (
          <Alert
            variant="danger"
            className="mt-3"
            data-testid="catme-audit-error"
          >
            {error}
          </Alert>
        )}

        {result && <CATMEAuditResults result={result} />}
      </Card.Body>
    </Card>
  );
}
