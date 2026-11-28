import React from "react";
import { Alert, Table } from "react-bootstrap";

export default function CATMEAuditResults({ result }) {
  const updates = result.studentsToUpdate ?? [];
  const drops = result.studentsToDrop ?? [];

  return (
    <div className="mt-4" data-testid="catme-audit-results">
      <h5>Audit Results</h5>

      {updates.length === 0 && drops.length === 0 ? (
        <Alert variant="success">
          No student updates or removals were detected.
        </Alert>
      ) : (
        <Alert variant="warning">
          Found {updates.length} updates and {drops.length} removals.
        </Alert>
      )}

      <h6>Students to Update ({updates.length})</h6>

      {updates.length === 0 ? (
        <p>No students need updating.</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Field</th>
              <th>Old Value</th>
              <th>New Value</th>
            </tr>
          </thead>
          <tbody>
            {updates.map((student, index) => (
              <tr key={`${student.studentId}-${student.field}-${index}`}>
                <td>{student.studentId}</td>
                <td>{student.name}</td>
                <td>{student.field}</td>
                <td>{student.oldValue}</td>
                <td>{student.newValue}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <h6>Students to Drop ({drops.length})</h6>

      {drops.length === 0 ? (
        <p>No students need removing.</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Section</th>
            </tr>
          </thead>
          <tbody>
            {drops.map((student, index) => (
              <tr key={`${student.studentId}-${index}`}>
                <td>{student.studentId}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.section}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
