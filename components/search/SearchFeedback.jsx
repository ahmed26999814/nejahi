"use client";

export default function SearchFeedback({ error, message, text }) {
  if (!error && !message) return null;

  return (
    <div
      id="search-feedback"
      role={error ? "alert" : "status"}
      className={`search-feedback ${error ? "search-feedback-error" : "search-feedback-success"}`}
    >
      <p>{error || message}</p>
      {error && (
        <ul className="mt-1 list-disc ps-5 font-bold">
          <li>{text?.checkCandidateNumber || "تأكد من كتابة رقم المترشح بصورة صحيحة."}</li>
          <li>{text?.checkExam || "تأكد من اختيار المسابقة الصحيحة."}</li>
          <li>{text?.tryLeadingZeros || "جرّب الرقم بالأصفار الموجودة في بدايته أو بدونها."}</li>
        </ul>
      )}
    </div>
  );
}
