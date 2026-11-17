import React from "react";
import CourseDownloadsForm from "../Courses/CourseDownloadsForm";
import { toast } from "react-toastify";

export default function DownloadsTabComponent({ courseId, testIdPrefix }) {
  const onSuccessDownloadTriggered = () => {
    toast("Download successfully initiated.");
  };

  const handleSubmit = () => {
    console.log(`Frontend form submit action captured for course: ${courseId}`);
    onSuccessDownloadTriggered();
  };
  const handleCombinedTeamsDownload = () => {
    window.open(`/api/csv/combinedteams?courseId=${courseId}`, "_blank");
  };

  return (
    <div data-testid={`${testIdPrefix}-downloadsTab`}>
      <CourseDownloadsForm
        downloadAction={handleSubmit}
        downloadCombinedTeamsAction={handleCombinedTeamsDownload}
        testIdPrefix={testIdPrefix}
      />
    </div>
  );
}
