// The thinking state: plain lines saying what is happening, not a spinner.

export type Step = { text: string; done: boolean };

export default function Steps({ steps }: { steps: Step[] }) {
  return (
    <div className="steps" aria-live="polite">
      {steps.map((s, i) => (
        <div className={`step ${s.done ? "" : "now"}`} key={i}>
          <span className="step-tag">{s.done ? "Done" : "Now"}</span>
          <p>{s.text}</p>
        </div>
      ))}
    </div>
  );
}
